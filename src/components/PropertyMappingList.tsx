import React from 'react';

interface PropertyMappingListProps {
  invalidProperties: Map<string, string[]>;
  onEditMapping: (propertyName: string) => void;
}

const PropertyMappingList: React.FC<PropertyMappingListProps> = ({ invalidProperties, onEditMapping }) => {
  if (invalidProperties.size === 0) {
    return null;
  }

  return (
    <div className="invalid-properties-list">
      <h4>유효하지 않은 CSS 속성 ({invalidProperties.size}개)</h4>
      <p>다음 속성은 표준 CSS 속성이 아닙니다. 표준 CSS 속성으로 매핑하거나 무시할 수 있습니다.</p>

      {Array.from(invalidProperties.keys()).map((propName) => (
        <div key={propName} className="invalid-property-item">
          <div className="invalid-property-name">{propName}</div>
          <div className="invalid-property-mappings">
            {invalidProperties.get(propName)?.length ? (
              <>
                <span>매핑됨: {invalidProperties.get(propName)?.join(', ')}</span>
                <button 
                  className="btn-property-mapping" 
                  onClick={() => onEditMapping(propName)}
                >
                  매핑 수정
                </button>
              </>
            ) : (
              <button 
                className="btn-property-mapping" 
                onClick={() => onEditMapping(propName)}
              >
                CSS 속성 매핑 설정
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyMappingList;
