import React, { useState, useEffect } from 'react';
import '../styles/CustomPropertyDetectionDialog.css';

interface CustomPropertyDetectionDialogProps {
  cssText: string;
  cssKeywords: string[];
  customProperties: Array<{name: string, mappedTo: string[], description?: string}>;
  onSave: (detectedProperties: Array<{name: string, mappedTo: string[], description?: string}>) => void;
  onCancel: () => void;
}

const CustomPropertyDetectionDialog: React.FC<CustomPropertyDetectionDialogProps> = ({
  cssText,
  cssKeywords,
  customProperties,
  onSave,
  onCancel
}) => {
  // 검출된 사용자 정의 속성
  const [detectedProperties, setDetectedProperties] = useState<Array<{name: string, mappedTo: string[], description?: string}>>([]);

  // CSS 텍스트에서 사용자 정의 속성 검출
  useEffect(() => {
    const detectCustomProperties = () => {
      // CSS 규칙 추출 정규식 (문자열로 정의하여 중괄호 문제 해결)
      const ruleRegex = new RegExp("([^{}]+)\\s*\\{\\s*([^{}]+)\\s*\\}", "g");
      const propertyRegex = /([\w-]+)\s*:\s*([^;]+);?/g;

      const newDetectedProperties = new Map<string, {name: string, mappedTo: string[], description?: string}>();

      // 기존 사용자 정의 속성 먼저 등록
      customProperties.forEach(prop => {
        newDetectedProperties.set(prop.name, prop);
      });

      // CSS 규칙 추출
      let ruleMatch;
      while ((ruleMatch = ruleRegex.exec(cssText)) !== null) {
        const ruleBody = ruleMatch[2];

        // 규칙 내의 속성 추출
        let propertyMatch;
        while ((propertyMatch = propertyRegex.exec(ruleBody)) !== null) {
          const propName = propertyMatch[1].trim();

          // 표준 CSS 속성이 아닌 경우 처리
          if (!cssKeywords.includes(propName) && !propName.startsWith('--')) {
            // 이미 알려진 사용자 정의 속성인지 확인
            if (!newDetectedProperties.has(propName)) {
              // 새로운 사용자 정의 속성 추가
              let mappedTo: string[] = [];

              // 기본 매핑 추정
              if (propName === 'padding-horizontal') {
                mappedTo = ['padding-left', 'padding-right'];
              } else if (propName === 'padding-vertical') {
                mappedTo = ['padding-top', 'padding-bottom'];
              } else if (propName === 'margin-horizontal') {
                mappedTo = ['margin-left', 'margin-right'];
              } else if (propName === 'margin-vertical') {
                mappedTo = ['margin-top', 'margin-bottom'];
              } else if (propName.includes('horizontal')) {
                const baseProp = propName.replace('horizontal', '');
                mappedTo = [`${baseProp}left`, `${baseProp}right`];
              } else if (propName.includes('vertical')) {
                const baseProp = propName.replace('vertical', '');
                mappedTo = [`${baseProp}top`, `${baseProp}bottom`];
              }

              newDetectedProperties.set(propName, {
                name: propName,
                mappedTo,
                description: `검출된 사용자 정의 CSS 속성: ${propName}`
              });
            }
          }
        }
      }

      // Map을 배열로 변환
      setDetectedProperties(Array.from(newDetectedProperties.values()));
    };

    detectCustomProperties();
  }, [cssText, cssKeywords, customProperties]);

  // 매핑 업데이트 핸들러
  const handleUpdateMapping = (propName: string, mappedTo: string[]) => {
    setDetectedProperties(prevProps => 
      prevProps.map(prop => 
        prop.name === propName ? {...prop, mappedTo} : prop
      )
    );
  };

  // 매핑 입력 컴포넌트
  const MappingInput = ({ property }: { property: {name: string, mappedTo: string[], description?: string} }) => {
    const [newMapping, setNewMapping] = useState('');

    const handleAddMapping = () => {
      if (newMapping.trim() && !property.mappedTo.includes(newMapping.trim())) {
        handleUpdateMapping(property.name, [...property.mappedTo, newMapping.trim()]);
        setNewMapping('');
      }
    };

    const handleRemoveMapping = (mapping: string) => {
      handleUpdateMapping(
        property.name, 
        property.mappedTo.filter(m => m !== mapping)
      );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddMapping();
      }
    };

    return (
      <div className="mapping-property-item">
        <div className="mapping-property-name">{property.name}</div>
        <div className="mapping-input-container">
          <div className="mapping-input-group">
            <input 
              type="text" 
              value={newMapping}
              onChange={(e) => setNewMapping(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="매핑할 CSS 속성 입력"
            />
            <button type="button" onClick={handleAddMapping}>추가</button>
          </div>

          {property.mappedTo.length > 0 ? (
            <div className="mapping-tags">
              {property.mappedTo.map((mapping, index) => (
                <div key={index} className="mapping-tag">
                  {mapping}
                  <button type="button" onClick={() => handleRemoveMapping(mapping)}>&times;</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-mappings-message">
              매핑된 CSS 속성이 없습니다. 이 속성을 어떤 표준 CSS 속성으로 변환할지 지정하세요.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="custom-property-detection-overlay">
      <div className="custom-property-detection-dialog">
        <h3>사용자 정의 CSS 속성 검출</h3>

        {detectedProperties.length > 0 ? (
          <>
            <p>다음 사용자 정의 CSS 속성이 발견되었습니다. 각 속성을 어떤 표준 CSS 속성으로 변환할지 설정하세요.</p>

            <div className="detected-properties-list">
              {detectedProperties.map((prop) => (
                <MappingInput key={prop.name} property={prop} />
              ))}
            </div>

            <div className="dialog-buttons">
              <button type="button" className="save-button" onClick={() => onSave(detectedProperties)}>저장</button>
              <button type="button" className="cancel-button" onClick={onCancel}>취소</button>
            </div>
          </>
        ) : (
          <>
            <p>사용자 정의 CSS 속성이 발견되지 않았습니다.</p>
            <div className="dialog-buttons">
              <button type="button" onClick={onCancel}>닫기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomPropertyDetectionDialog;
