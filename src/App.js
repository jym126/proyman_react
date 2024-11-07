import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Estilos de Quill para el editor
import './App.css';

const loadDataFromLocalStorage = () => {
  const storedData = localStorage.getItem('proymanData');
  if (storedData) {
    return JSON.parse(storedData);
  } else {
    return {
      pendientes: [
        { id: '1', title: 'Proyecto 1', description: 'Descripción del proyecto 1' }
      ],
      enEjecucion: [
        { id: '2', title: 'Proyecto 2', description: 'Descripción del proyecto 2' }
      ],
      finalizadas: [
        { id: '3', title: 'Proyecto 3', description: 'Descripción del proyecto 3' }
      ],
    };
  }
};

const saveDataToLocalStorage = (data) => {
  localStorage.setItem('proymanData', JSON.stringify(data));
};

const App = () => {
  const [data, setData] = useState(loadDataFromLocalStorage);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalCardId, setModalCardId] = useState(null);
  const [modalDescription, setModalDescription] = useState('');

  const handleDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;

    const sourceList = data[source.droppableId];
    const destinationList = data[destination.droppableId];

    const [movedCard] = sourceList.splice(source.index, 1);
    destinationList.splice(destination.index, 0, movedCard);

    const updatedData = {
      ...data,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destinationList,
    };

    setData(updatedData);
    saveDataToLocalStorage(updatedData);
  };

  const handleDescriptionChange = (cardId, status, newDescriptionHTML) => {
    const updatedData = { ...data };
    updatedData[status] = updatedData[status].map((card) =>
      card.id === cardId ? { ...card, description: newDescriptionHTML } : card
    );
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
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

  const saveDescription = () => {
    const status = Object.keys(data).find((status) =>
      data[status].some((card) => card.id === modalCardId)
    );
    handleDescriptionChange(modalCardId, status, modalDescription);
    closeModal();
  };

  const handleAddCard = (status) => {
    if (!newCardTitle.trim()) return;
    const newCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      description: '',
    };
    const updatedData = { ...data };
    updatedData[status].push(newCard);
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
    setNewCardTitle('');
  };

  const handleDeleteCard = (cardId, status) => {
    const updatedData = { ...data };
    updatedData[status] = updatedData[status].filter((card) => card.id !== cardId);
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
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
                    <Draggable key={card.id} draggableId={card.id} index={index}>
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
                                  c.id === card.id ? { ...c, title: e.target.value } : c
                                );
                                setData(updatedData);
                                saveDataToLocalStorage(updatedData);
                              }}
                              className="card-title"
                            />
                          </div>
                          <div
                            className="card-description"
                            dangerouslySetInnerHTML={{ __html: card.description }}
                            onClick={() => openModal(card.id, card.description)}
                          />
                          <button
                            className="delete-card-btn"
                            onClick={() => handleDeleteCard(card.id, status)}
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

      {/* Modal para editar la descripción de la tarjeta */}
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
              <button className="modal-btn" onClick={saveDescription}>Guardar</button>
              <button className="modal-btn" onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
