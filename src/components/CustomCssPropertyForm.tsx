import React, { useState } from 'react';
import '../styles/CustomCssPropertyForm.css';

interface CustomCssPropertyFormProps {
  propertyName: string;
  initialMappings?: string[];
  onSave: (name: string, mappings: string[]) => void;
  onCancel: () => void;
}

const CustomCssPropertyForm: React.FC<CustomCssPropertyFormProps> = ({
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
    <div className="custom-css-property-form">
      <h4>'{propertyName}' 속성 매핑 설정</h4>

      <div className="form-group">
        <label htmlFor="property-name">속성 이름:</label>
        <input 
          type="text" 
          id="property-name" 
          value={propertyName}
          disabled
        />
        <p className="helper-text">JSON 파일에서 발견된 속성 이름입니다.</p>
      </div>

      <div className="form-group">
        <label htmlFor="mapping">매핑할 CSS 속성:</label>
        <div className="mapping-input-group">
          <input 
            type="text" 
            id="mapping" 
            value={newMapping}
            onChange={(e) => setNewMapping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="매핑할 CSS 속성을 입력하세요"
          />
          <button type="button" onClick={handleAddMapping}>추가</button>
        </div>
        <p className="helper-text">매핑할 표준 CSS 속성을 입력하고 Enter 또는 추가 버튼을 클릭하세요. 여러 속성을 추가할 수 있습니다.</p>

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
      </div>

      <div className="button-group">
        <button type="button" className="cancel-button" onClick={onCancel}>취소</button>
        <button type="button" className="save-button" onClick={handleSave}>저장</button>
      </div>
    </div>
  );
};

export default CustomCssPropertyForm;
