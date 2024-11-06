import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; 
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
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para el modal
  const [modalCardId, setModalCardId] = useState(null); // ID de la tarjeta seleccionada para editar
  const [modalDescription, setModalDescription] = useState(''); // Descripción para el modal

  // Manejo de la acción de finalizar el arrastre de una tarjeta
  const handleDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return; // Si no se soltó en ningún contenedor, no hacer nada

    // Copiar las listas de origen y destino
    const sourceList = data[source.droppableId];
    const destinationList = data[destination.droppableId];
    
    // Eliminar la tarjeta de la lista de origen y añadirla a la lista de destino
    const [movedCard] = sourceList.splice(source.index, 1);
    destinationList.splice(destination.index, 0, movedCard);

    const updatedData = {
      ...data,
      [source.droppableId]: sourceList,
      [destination.droppableId]: destinationList,
    };

    // Actualizar el estado y guardar en localStorage
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
  };

  // Manejo de la edición de la descripción de la tarjeta
  const handleDescriptionChange = (cardId, status, newDescription) => {
    const updatedData = { ...data };
    updatedData[status] = updatedData[status].map((card) =>
      card.id === cardId ? { ...card, description: newDescription } : card
    );
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
  };

  // Abrir el modal para editar la descripción de la tarjeta
  const openModal = (cardId, description) => {
    setModalCardId(cardId);
    setModalDescription(description);
    setIsModalOpen(true);
  };

  // Cerrar el modal
  const closeModal = () => {
    setIsModalOpen(false);
    setModalCardId(null);
    setModalDescription('');
  };

  // Guardar la descripción editada
  const saveDescription = () => {
    const status = Object.keys(data).find((status) =>
      data[status].some((card) => card.id === modalCardId)
    );
    handleDescriptionChange(modalCardId, status, modalDescription);
    closeModal();
  };

  // Agregar una nueva tarjeta
  const handleAddCard = (status) => {
    if (!newCardTitle.trim()) return; // Evitar agregar tarjetas sin título
    const newCard = {
      id: Date.now().toString(),
      title: newCardTitle,
      description: '',
    };
    const updatedData = { ...data };
    updatedData[status].push(newCard);
    setData(updatedData);
    saveDataToLocalStorage(updatedData);
    setNewCardTitle(''); // Limpiar el input de título después de agregar
  };

  // Eliminar una tarjeta
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
          onClick={() => handleAddCard('pendientes')} // Puedes cambiar la categoría según el caso
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
                  className="column"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  <h2>{status === 'pendientes' ? 'Pendientes' : status === 'enEjecucion' ? 'En Ejecución' : 'Finalizadas'}</h2>
                  {data[status].map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(provided) => (
                        <div
                          className="card"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            backgroundColor: 'white',
                            marginBottom: '8px',
                            borderRadius: '4px',
                            padding: '10px',
                            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                            opacity: provided.isDragging ? 0.7 : 1,
                          }}
                        >
                          <div className="card-header" style={{ backgroundColor: '#293972', color: 'white', padding: '5px', borderRadius: '4px' }}>
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
                          <textarea
                            value={card.description}
                            onClick={() => openModal(card.id, card.description)} // Abre el modal para editar
                            rows="4"
                            style={{ width: '100%', marginTop: '5px' }}
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
            <textarea
              value={modalDescription}
              onChange={(e) => setModalDescription(e.target.value)}
              rows="6"
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
