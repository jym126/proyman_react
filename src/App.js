import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_URL = 'http://localhost:3600/projects';

// Cargar datos desde localStorage
const loadDataFromLocalStorage = () => {
  const storedData = localStorage.getItem('proymanData');
  return storedData ? JSON.parse(storedData) : {};
};

// Guardar datos en localStorage
const saveDataToLocalStorage = (data) => {
  localStorage.setItem('proymanData', JSON.stringify(data));
};

const App = () => {
  const [data, setData] = useState(loadDataFromLocalStorage());
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCardId, setModalCardId] = useState(null);
  const [modalDescription, setModalDescription] = useState('');

  useEffect(() => {
    // Cargar datos desde MongoDB al inicio
    axios.get(API_URL).then((response) => {
      const mongoData = {
        pendientes: response.data.filter((proj) => proj.status === 'pendientes'),
        enEjecucion: response.data.filter((proj) => proj.status === 'enEjecucion'),
        finalizadas: response.data.filter((proj) => proj.status === 'finalizadas'),
      };
      setData(mongoData);
      saveDataToLocalStorage(mongoData);
    });
  }, []);

  const handleDragEnd = async (result) => {
    const { destination, source } = result;
    if (!destination) return;

    const sourceList = data[source.droppableId];
    const destinationList = data[destination.droppableId];
    const [movedCard] = sourceList.splice(source.index, 1);
    destinationList.splice(destination.index, 0, movedCard);
    movedCard.status = destination.droppableId;

    const updatedData = {
      ...data,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destinationList,
    };

    setData(updatedData);
    saveDataToLocalStorage(updatedData);
    await axios.put(`${API_URL}/${movedCard._id}`, movedCard);
  };

  const handleAddCard = async (status) => {
    if (!newCardTitle.trim()) return;
    const newCard = { title: newCardTitle, description: '', status };

    const response = await axios.post(API_URL, newCard);
    const cardWithId = { ...newCard, _id: response.data._id }; // Incluye el _id devuelto por la API

    const updatedData = { ...data, [status]: [...data[status], cardWithId] };
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
    setNewCardTitle('');
  };

  const handleDeleteCard = async (cardId, status) => {
    try {
      const result = await Swal.fire({
        title: '¿Seguro que desea borrar este proyecto?',
        text: 'Esta acción no se puede revertir!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí',
      });

      if (result.isConfirmed) {
        await axios.delete(`${API_URL}/${cardId}`);
        const updatedData = {
          ...data,
          [status]: data[status].filter((card) => card._id !== cardId) // Asegúrate de usar _id
        };
        setData(updatedData);
        saveDataToLocalStorage(updatedData);
        Swal.fire('Borrado!', 'El proyecto ha sido eliminado.', 'success');
      }
    } catch (error) {
      console.error("Error eliminando el proyecto:", error);
      Swal.fire('Error', 'Ocurrió un problema al intentar eliminar el proyecto.', 'error');
    }
  };

  const openModal = (cardId, description) => {
    setModalCardId(cardId);
    setModalDescription(description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalCardId(null);
    setModalDescription('');
  };

  const saveDescription = async () => {
    const status = Object.keys(data).find((key) => data[key].some((card) => card._id === modalCardId));
    const updatedData = { ...data };
    const card = updatedData[status].find((card) => card._id === modalCardId);
    card.description = modalDescription;
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
    closeModal();
    await axios.put(`${API_URL}/${modalCardId}`, card);
  };

  return (
    <div>
      <div className="header">
        <input
          type="text"
          placeholder="Nuevo título"
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          className="new-card-input"
        />
        <button
          className="add-card-btn"
          onClick={() => handleAddCard('pendientes')}
        >
          Añadir Nuevo Proyecto
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board">
          {['pendientes', 'enEjecucion', 'finalizadas'].map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided) => (
                <div
                  className={`column column-${status}`}
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2>
                    {status === 'pendientes'
                      ? 'Pendientes'
                      : status === 'enEjecucion'
                        ? 'En Ejecución'
                        : 'Finalizadas'}
                  </h2>
                  {data[status].map((card, index) => (
                    <Draggable key={card._id} draggableId={card._id} index={index}>
                      {(provided) => (
                        <div
                          className="card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div
                            className="card-header"
                            style={{ backgroundColor: '#114d8a', color: 'white' }}
                          >
                            <input
                              type="text"
                              value={card.title}
                              onChange={(e) => {
                                const updatedData = { ...data };
                                updatedData[status] = updatedData[status].map((c) =>
                                  c._id === card._id ? { ...c, title: e.target.value } : c
                                );
                                setData(updatedData);
                                saveDataToLocalStorage(updatedData);
                              }}
                              className="card-title"
                            />
                          </div>
                          <div
                            type="text"
                            className="card-description"
                            placeholder="Descripción aqui..."
                            dangerouslySetInnerHTML={{ __html: card.description }}
                            onClick={() => openModal(card._id, card.description)}
                          />
                          <button
                            className="delete-card-btn"
                            onClick={() => handleDeleteCard(card._id, status)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Editar Descripción</h2>
            <ReactQuill
              value={modalDescription}
              onChange={setModalDescription}
              theme="snow"
              style={{ width: '100%', marginTop: '10px' }}
            />
            <div className="modal-actions">
              <button className="modal-btn" onClick={saveDescription}>
                Guardar
              </button>
              <button className="modal-btn" onClick={closeModal}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
