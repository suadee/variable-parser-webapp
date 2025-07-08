import React, { useState } from 'react';

interface InvalidCssPropertyDialogProps {
  propertyName: string;
  initialMappings?: string[];
  onSave: (name: string, mappings: string[]) => void;
  onCancel: () => void;
}

const InvalidCssPropertyDialog: React.FC<InvalidCssPropertyDialogProps> = ({
  propertyName,
  initialMappings = [],
  onSave,
  onCancel
}) => {
  const [mappings, setMappings] = useState<string[]>(initialMappings);
  const [newMapping, setNewMapping] = useState<string>('');

  const handleAddMapping = () => {
    if (newMapping.trim() && !mappings.includes(newMapping.trim())) {
      setMappings([...mappings, newMapping.trim()]);
      setNewMapping('');
    }
  };

  const handleRemoveMapping = (mapping: string) => {
    setMappings(mappings.filter(m => m !== mapping));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMapping();
    }
  };

  const handleSave = () => {
    onSave(propertyName, mappings);
  };

  return (
    <div className="property-mapping-dialog-overlay">
      <div className="property-mapping-dialog">
        <h3>유효하지 않은 CSS 속성 매핑</h3>
        <p>
          <code>{propertyName}</code>은(는) 유효한 CSS 속성이 아닙니다. 이 속성을 어떤 표준 CSS 속성으로 매핑할지 설정하세요.
        </p>

        <div className="mapping-input">
          <label>매핑할 CSS 속성:</label>
          <div className="mapping-input-group">
            <input 
              type="text" 
              value={newMapping}
              onChange={(e) => setNewMapping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="표준 CSS 속성 입력 (예: margin-top)"
            />
            <button type="button" onClick={handleAddMapping}>추가</button>
          </div>
          <small>여러 CSS 속성을 추가할 수 있습니다 (예: margin-horizontal → margin-left, margin-right)</small>
        </div>

        {mappings.length > 0 && (
          <div className="mapping-tags">
            {mappings.map((mapping, index) => (
              <div key={index} className="mapping-tag">
                {mapping}
                <button type="button" onClick={() => handleRemoveMapping(mapping)}>&times;</button>
              </div>
            ))}
          </div>
        )}

        <div className="dialog-buttons">
          <button type="button" onClick={handleSave}>저장</button>
          <button type="button" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
};

export default InvalidCssPropertyDialog;
