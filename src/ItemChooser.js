import React, { useState } from 'react';
import Modal from './Modal';

function ItemChooser({ title, items, onSelect, isOpen, onClose, getLabel, getDetail }) {

  const handleSelectItem = (item) => {
    console.log(item);
    onSelect(item);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal title={title} isOpen={isOpen} onClose={handleCancel}>
      <div className="content scrollbar">
        {items.map((item,index) => (
          <div key={index} className="modal-list-item" onClick={() => handleSelectItem(item)}>
              <div className='header'>{getLabel(item)}</div>
              <div className='content'>{getDetail(item)}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export default ItemChooser;
