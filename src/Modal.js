import React, { useState } from 'react';

function Modal({ title, children, isOpen, onClose }) {

  const handleClose = () => {
    onClose();
  };

  return isOpen ? (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={handleClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
        </header>
        <section className="modal-card-body">
          {children}
        </section>
      </div>
    </div>
  ) :
  (
    <div></div>
  );
}

export default Modal;