import React, { useState, useEffect } from 'react';
import '../styles/ParserRule.css';
import { extractTokenProperties, generateJsonTokensAsCssVariables, generateTokenToToken, isValidCssProperty, getCustomCssProperties, applyInvalidCssPropertyMappings } from '../utils/ParserUtils';
import CustomCssPropertyForm from './CustomCssPropertyForm';
import InvalidCssPropertyDialog from './InvalidCssPropertyDialog';
import PropertyMappingList from './PropertyMappingList';
import CustomPropertyDetectionDialog from './CustomPropertyDetectionDialog';

// transformKey 함수 로컬 정의 (임포트 문제 방지)
const transformKey = (key: string, separator: string = '-', lowercase: boolean = true): string => {
  // 공백을 지정된 분리자로 변환
  let transformed = key.replace(/\s+/g, separator);

  // 필요한 경우 소문자로 변환
  if (lowercase) {
    transformed = transformed.toLowerCase();
  }

  return transformed;
};

interface RuleOption {
  name: string;
  value: string;
}

interface Property {
  name: string;
  isSelected: boolean;
}

const ParserRule: React.FC = () => {
  const [taskType, setTaskType] = useState<string>('jsonToCss');
  const [files, setFiles] = useState<File[]>([]);
  const [fileStructure, setFileStructure] = useState<any>(null);
  const [propertyNames, setPropertyNames] = useState<string[]>([]);
  const [replaceSpace, setReplaceSpace] = useState<string>('-');
  const [keySpaceReplacer, setKeySpaceReplacer] = useState<string>('-');
  const [lowercaseEnabled, setLowercaseEnabled] = useState<boolean>(true);
  const [transformKeyNames, setTransformKeyNames] = useState<boolean>(true);
  const [usePrefixEnabled, setUsePrefixEnabled] = useState<boolean>(false);
  const [variablePrefix, setVariablePrefix] = useState<string>('tgds');
  const [useSourcePrefixEnabled, setUseSourcePrefixEnabled] = useState<boolean>(false);
  const [sourcePrefix, setSourcePrefix] = useState<string>('tgds');
  const [pathSeparator, setPathSeparator] = useState<string>('-');
  const [propertyTransformCustomization, setPropertyTransformCustomization] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['$value']);
  const [preview, setPreview] = useState<string>('');

  // CodeSyntax 속성 지원 추가
  const [hasCodeSyntax, setHasCodeSyntax] = useState<boolean>(false);
  const [useCodeSyntax, setUseCodeSyntax] = useState<boolean>(false);

  // Token 출력 형식
  const [tokenOutputFormat, setTokenOutputFormat] = useState<string>('cssVars');

  // JSON to CSS 추가 상태
  const [responsiveType, setResponsiveType] = useState<string>('resolution'); // 'resolution' 또는 'theme'
  const [fileConfigurations, setFileConfigurations] = useState<{
    id: number, 
    file: File, 
    config: string, 
    minWidth?: number, 
    maxWidth?: number
  }[]>([]);
  const [defaultFileId, setDefaultFileId] = useState<number | null>(null);

  // 속성 경로 깊이 설정 (어떤 수준까지 속성 이름으로 사용할지)
  const [propertyPathDepth, setPropertyPathDepth] = useState<number>(1);

  // 유효하지 않은 CSS 속성 매핑을 저장하는 상태
  const [invalidCssProperties, setInvalidCssProperties] = useState<Map<string, string[]>>(new Map());

  // 사용자에게 매핑 확인 요청 여부를 나타내는 상태
  const [showPropertyMappingModal, setShowPropertyMappingModal] = useState<boolean>(false);
  const [currentPropertyToMap, setCurrentPropertyToMap] = useState<string>('');

  // 사용자 정의 속성 자동 검출 다이얼로그 상태
  const [showPropertyDetectionDialog, setShowPropertyDetectionDialog] = useState<boolean>(false);
  const [detectedCssText, setDetectedCssText] = useState<string>('');

  // 사용자 정의 CSS 속성 검출 함수
  const detectCustomProperties = (css: string, keywords: string[]) => {
    // CSS 규칙 추출 정규식 - 중첩된 중괄호 처리를 위해 수정
    const ruleRegex = /([^{}]+)\s*\{\s*([^{}]*)\s*\}/g;
    const propertyRegex = /([\w-]+)\s*:\s*([^;]+);?/g;

    const detected = new Set<string>();
    const customPropsArray = customCssProperties;
    const existing = new Set(customPropsArray.map(p => p.name));

    // CSS 규칙 추출
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(css)) !== null) {
      const ruleBody = ruleMatch[2];

      // 규칙 내의 속성 추출
      let propertyMatch;
      while ((propertyMatch = propertyRegex.exec(ruleBody)) !== null) {
        const propName = propertyMatch[1].trim();

        // 표준 CSS 속성이 아니고 이미 등록된 사용자 정의 속성도 아닌 경우 추가
        if (!keywords.includes(propName) && !propName.startsWith('--') && !existing.has(propName)) {
          detected.add(propName);
        }
      }
    }

    return detected.size > 0;
  };

  // 유효하지 않은 CSS 속성 매핑을 처리하는 함수
  const handleInvalidCssPropertyMapping = (propName: string, mappedValues: string[]) => {
    const newInvalidCssProperties = new Map(invalidCssProperties);
    newInvalidCssProperties.set(propName, mappedValues);
    setInvalidCssProperties(newInvalidCssProperties);
  };

  // 매핑 대화상자 열기
  const openPropertyMappingDialog = (propertyName: string) => {
    setCurrentPropertyToMap(propertyName);
    setShowPropertyMappingModal(true);
  };

  // 매핑 저장 핸들러
  const handleSavePropertyMapping = (propertyName: string, mappedValues: string[]) => {
    handleInvalidCssPropertyMapping(propertyName, mappedValues);
    setShowPropertyMappingModal(false);
  };

  // CSS 자동 검출 다이얼로그 열기
  const openCustomPropertyDetectionDialog = (cssText: string) => {
    setDetectedCssText(cssText);
    setShowPropertyDetectionDialog(true);
  };

  // 사용자 정의 CSS 속성을 저장하는 함수
  const saveCustomCssProperties = () => {
    const updatedCustomProperties = [...customCssProperties];
    invalidCssProperties.forEach((mappedTo, name) => {
      // 이미 존재하는지 확인
      const existingIndex = updatedCustomProperties.findIndex(p => p.name === name);
      if (existingIndex >= 0) {
        // 업데이트
        updatedCustomProperties[existingIndex].mappedTo = mappedTo;
      } else {
        // 새로 추가
        updatedCustomProperties.push({
          name, 
          mappedTo, 
          description: `사용자 정의 CSS 속성: ${name}`
        });
      }
    });
    setCustomCssProperties(updatedCustomProperties);
    return updatedCustomProperties;
  };

  // 사용자 지정 CSS 속성 추가 함수
  const addCustomCssProperty = (name: string, mappedTo: string[]) => {
    const updatedCustomProperties = [...customCssProperties];
    const existingIndex = updatedCustomProperties.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

    if (existingIndex >= 0) {
      // 기존 속성 업데이트
      updatedCustomProperties[existingIndex].mappedTo = mappedTo;
    } else {
      // 새 속성 추가
      updatedCustomProperties.push({
        name,
        mappedTo,
        description: `사용자 정의 CSS 속성: ${name}`
      });
    }

    setCustomCssProperties(updatedCustomProperties);
    return updatedCustomProperties;
  };

  // CSS 키워드 목록을 직접 컴포넌트에서 로드
  const [cssKeywords, setCssKeywords] = useState<string[]>([]);

  // 사용자 정의 CSS 속성 목록
  const [customCssProperties, setCustomCssProperties] = useState<Array<{name: string, mappedTo: string[], description?: string}>>([]);

  // 컴포넌트 마운트 시 CSS 키워드 로드
  useEffect(() => {
    const loadCssKeywords = async () => {
      try {
        // 먼저 css-keywords.json 파일 시도
        try {
          const module = await import('../data/css-keywords.json');
          setCssKeywords(module.default);
          console.log('CSS 키워드 목록 로드 완료: css-keywords.json');
        } catch (error) {
          console.warn('css-keywords.json 로드 실패, css-keyword.json 시도:', error);
          // 실패하면 css-keyword.json 시도
          const fallbackModule = await import('../data/css-keyword.json');
          setCssKeywords(fallbackModule.default);
          console.log('CSS 키워드 목록 로드 완료: css-keyword.json');
        }
      } catch (error) {
        console.error('CSS 키워드 파일 로드 실패:', error);
      }
    };

    // CSS 키워드 로드 함수 호출
    loadCssKeywords();

    // 기본 사용자 정의 속성 목록 설정
    setCustomCssProperties([
      { name: 'padding-horizontal', mappedTo: ['padding-left', 'padding-right'], description: '좌우 패딩을 한 번에 설정하기 위한 속성' },
      { name: 'padding-vertical', mappedTo: ['padding-top', 'padding-bottom'], description: '상하 패딩을 한 번에 설정하기 위한 속성' },
      { name: 'margin-horizontal', mappedTo: ['margin-left', 'margin-right'], description: '좌우 마진을 한 번에 설정하기 위한 속성' },
      { name: 'margin-vertical', mappedTo: ['margin-top', 'margin-bottom'], description: '상하 마진을 한 번에 설정하기 위한 속성' }
    ]);
  }, []);

  // useEffect를 사용하여 속성 매핑 변경 시 프리뷰 업데이트
  useEffect(() => {
    if (fileStructure) {
      // 프리뷰 다시 생성
      const timer = setTimeout(() => {
        generatePreview();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [invalidCssProperties, customCssProperties]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      setFiles(fileList);

      // JSON to CSS의 다중 파일 처리
      if (taskType === 'jsonToCss' && fileList.length > 0) {
        // 각 파일에 대한 설정 초기화
        const configs = fileList.map((file, index) => {
          if (responsiveType === 'resolution') {
            if (index === 0) {
              // 첫 번째 파일: 1440px 이상
              return {
                id: index,
                file: file,
                config: '1440px 이상',
                minWidth: 1440,
                maxWidth: undefined
              };
            } else if (index === 1) {
              // 두 번째 파일: 768px-1439px
              return {
                id: index,
                file: file,
                config: '768px-1439px',
                minWidth: 768,
                maxWidth: 1439
              };
            } else {
              // 그 외 파일: 767px 이하
              return {
                id: index,
                file: file,
                config: '767px 이하',
                minWidth: undefined,
                maxWidth: 767
              };
            }
          } else {
            // 테마 대응
            return {
              id: index,
              file: file,
              config: index === 0 ? 'light' : 'dark'
            };
          }
        });

        setFileConfigurations(configs);
        setDefaultFileId(0); // 첫 번째 파일을 기본값으로 설정

        // 첫 번째 파일만 기본 분석
        if (fileList.length > 0) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonData = JSON.parse(e.target?.result as string);
              analyzeFileStructure(jsonData);

              // 파일 분석 후 자동으로 프리뷰 생성
              setTimeout(() => {
                generatePreview();
              }, 500);
            } catch (error) {
              console.error('JSON 파일을 파싱하는 중 오류가 발생했습니다:', error);
            }
          };
          reader.readAsText(fileList[0]);
        }
      } else {
        // 단일 파일 처리 (기존 로직)
        fileList.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const jsonData = JSON.parse(e.target?.result as string);
              analyzeFileStructure(jsonData);
              // 파일 분석 후 자동으로 프리뷰 생성
              setTimeout(() => {
                generatePreview();
              }, 500);
            } catch (error) {
              console.error('JSON 파일을 파싱하는 중 오류가 발생했습니다:', error);
            }
          };
          reader.readAsText(file);
        });
      }
    }
  };

  const analyzeFileStructure = (data: any) => {
    setFileStructure(data);

    // 변수 이름 추출 및 분석
    const propertyPaths: string[] = [];
    const invalidProperties: string[] = [];

    const extractPropertyPaths = (obj: any, path: string = '') => {
      if (obj && typeof obj === 'object') {
        if (obj.$type && obj.$value) {
          propertyPaths.push(path);

          // CodeSyntax 확인
          if (obj.$extensions?.['com.figma']?.codeSyntax &&
              Object.keys(obj.$extensions['com.figma'].codeSyntax).length > 0) {
            setHasCodeSyntax(true);
          }

          // 속성 이름이 유효한 CSS 속성인지 확인
          if (path) {
            // 선택된 경로 깊이에 따라 속성 이름 추출
            const pathParts = path.split('.');
            const relevantPathParts = propertyPathDepth >= pathParts.length 
              ? pathParts 
              : pathParts.slice(-propertyPathDepth);

            // 변환된 속성 이름
            const propertyName = transformKeyNames
              ? transformKey(relevantPathParts.join(pathSeparator), keySpaceReplacer, lowercaseEnabled)
              : relevantPathParts.join(pathSeparator);

            // 유효한 CSS 속성인지 확인
            if (!isValidCssProperty(propertyName, cssKeywords, customCssProperties)) {
              // 이미 등록된 매핑이 없다면 기본적으로 빈 배열로 설정
              if (!invalidCssProperties.has(propertyName)) {
                const newInvalidProps = new Map(invalidCssProperties);
                newInvalidProps.set(propertyName, []);
                setInvalidCssProperties(newInvalidProps);
              }
            }

            // 속성 이름으로 사용될 부분 (경로 깊이 설정에 따라 다름)
            const lastPathPart = relevantPathParts[relevantPathParts.length - 1];
            const cssPropertyName = transformKey(lastPathPart, keySpaceReplacer, lowercaseEnabled);

            // css-keyword.json 파일에서 로드한 CSS 키워드 목록과 검증
            const isStandardProperty = cssKeywords.length > 0 
              ? cssKeywords.includes(cssPropertyName.toLowerCase())
              : validCssProperties.includes(cssPropertyName.toLowerCase());

            // 사용자 정의 속성인지 확인
            const isCustomProperty = customCssProperties.some(prop => 
              prop.name.toLowerCase() === cssPropertyName.toLowerCase());

            const isValid = isStandardProperty || isCustomProperty;

            if (!isValid && !invalidProperties.includes(cssPropertyName)) {
              console.log(`유효하지 않은 CSS 속성 추가: ${cssPropertyName}`);
              invalidProperties.push(cssPropertyName);
            }
          }
        } else {
          Object.keys(obj).forEach(key => {
            if (key.charAt(0) !== '$') { // $ 접두사가 없는 속성만 처리
              extractPropertyPaths(obj[key], path ? `${path}.${key}` : key);
            }
          });
        }
      }
    };

    extractPropertyPaths(data);
    setPropertyNames(propertyPaths.map(path => path.split('.').join(' ')));

    // 유효하지 않은 속성들에 대한 처리
    console.log('유효하지 않은 CSS 속성들:', invalidProperties);

    // 유효하지 않은 속성들을 매핑 목록에 추가
    invalidProperties.forEach(propName => {
      if (!invalidCssProperties.has(propName)) {
        const defaultMapping: string[] = [];

        // 기존 매핑 규칙 적용
        if (propName.includes('padding-horizontal') || propName === 'padding-horizontal') {
          defaultMapping.push('padding-left', 'padding-right');
        } else if (propName.includes('padding-vertical') || propName === 'padding-vertical') {
          defaultMapping.push('padding-top', 'padding-bottom');
        } else if (propName.includes('margin-horizontal') || propName === 'margin-horizontal') {
          defaultMapping.push('margin-left', 'margin-right');
        } else if (propName.includes('margin-vertical') || propName === 'margin-vertical') {
          defaultMapping.push('margin-top', 'margin-bottom');
        } else if (propName.includes('border') && propName.includes('radius')) {
          // 테두리 반경 관련 속성 처리
          defaultMapping.push('border-radius');
        } else if (propName.includes('height')) {
          // 높이 관련 속성 처리
          defaultMapping.push('height');
        } else if (propName.includes('width')) {
          // 너비 관련 속성 처리
          defaultMapping.push('width');
        } else if (propName.includes('gap')) {
          // 간격 관련 속성 처리
          defaultMapping.push('gap');
        }

        // 맵에 추가
        const newInvalidCssProperties = new Map(invalidCssProperties);
        newInvalidCssProperties.set(propName, defaultMapping);
        setInvalidCssProperties(newInvalidCssProperties);

        // 유효하지 않은 CSS 속성이 발견되면 사용자에게 매핑 확인 요청 필요
        if (defaultMapping.length > 0) {
          setShowPropertyMappingModal(true);
        }
      }
    });
  };

  // 작업 유형 변경 시 상태 초기화 함수
  const handleTaskTypeChange = (newTaskType: string) => {
    // 기존 작업 유형과 다를 경우만 초기화 진행
    if (newTaskType !== taskType) {
      // 작업 유형 변경
      setTaskType(newTaskType);

      // 파일 및 분석 데이터 초기화
      setFiles([]);
      setFileStructure(null);
      setPropertyNames([]);
      setPropertyTransformCustomization([]);
      setPreview('');
      setHasCodeSyntax(false);

      // JSON to CSS 관련 상태 초기화
      setFileConfigurations([]);
      setDefaultFileId(null);
      setPropertyPathDepth(1);

      console.log(`작업 유형이 ${newTaskType}으로 변경되었습니다. 상태가 초기화되었습니다.`);
    }
  };

  const handleDragSelection = (event: React.MouseEvent, propertyName: string) => {
    // 드래그 선택 구현
    const words = propertyName.split(' ');
    // 실제 구현에서는 드래그 관련 로직 구현 필요
    setPropertyTransformCustomization(words);
  };

  /**
   * 유효하지 않은 CSS 속성을 확인하고 처리합니다.
   * @param propertyName 확인할 속성 이름
   * @returns 처리된 속성 이름 배열 (유효하지 않은 경우 매핑된 값)
   */
  /**
   * 유효하지 않은 CSS 속성을 확인하고 처리합니다.
   * @param propertyName 확인할 속성 이름
   * @returns 처리된 속성 이름 배열 (유효하지 않은 경우 매핑된 값)
   */
  const checkAndMapInvalidCssProperty = (propertyName: string): string[] => {
    // 공백을 구분자로 변환하여 CSS 속성 형태로 변환
    const cssPropertyName = transformKey(propertyName, keySpaceReplacer, lowercaseEnabled);

    // 이미 처리된 매핑이 있는지 확인
    if (invalidCssProperties.has(cssPropertyName)) {
      return invalidCssProperties.get(cssPropertyName) || [];
    }

    // 직접 컴포넌트에서 로드한 CSS 키워드 목록과 사용자 정의 속성 목록을 사용하여 유효성 검사
    const isStandardProperty = cssKeywords.length > 0 
      ? cssKeywords.includes(cssPropertyName.toLowerCase())
      : validCssProperties.includes(cssPropertyName.toLowerCase());

    // 사용자 정의 속성인지 확인
    const isCustomProperty = customCssProperties.some(prop => 
      prop.name.toLowerCase() === cssPropertyName.toLowerCase());

    // 사용자 정의 속성이면 매핑된 속성 사용
    if (isCustomProperty) {
      const customProp = customCssProperties.find(prop => 
        prop.name.toLowerCase() === cssPropertyName.toLowerCase());
      if (customProp?.mappedTo && customProp.mappedTo.length > 0) {
        return customProp.mappedTo;
      }
    }

    const isValid = isStandardProperty || isCustomProperty;

    // CSS 속성으로 유효한지 확인
    if (!isValid) {
      // 유효하지 않은 속성에 대한 기본 매핑 제안
      const defaultMapping: string[] = [];
      if (cssPropertyName.includes('padding-horizontal') || cssPropertyName === 'padding-horizontal') {
        defaultMapping.push('padding-left', 'padding-right');
      } else if (cssPropertyName.includes('padding-vertical')) {
        defaultMapping.push('padding-top', 'padding-bottom');
      } else if (cssPropertyName.includes('margin-horizontal')) {
        defaultMapping.push('margin-left', 'margin-right');
      } else if (cssPropertyName.includes('margin-vertical')) {
        defaultMapping.push('margin-top', 'margin-bottom');
      } else if (cssPropertyName.includes('border') && cssPropertyName.includes('radius')) {
        // 테두리 반경 관련 속성 처리
        defaultMapping.push('border-radius');
      } else if (cssPropertyName.includes('height')) {
        // 높이 관련 속성 처리
        defaultMapping.push('height');
      } else if (cssPropertyName.includes('width')) {
        // 너비 관련 속성 처리
        defaultMapping.push('width');
      } else if (cssPropertyName.includes('gap')) {
        // 간격 관련 속성 처리
        defaultMapping.push('gap');
      }

      // 콘솔에 디버그 정보 출력
      console.log(`유효하지 않은 CSS 속성 감지: ${cssPropertyName}`);

      // 맵에 추가
      const newInvalidCssProperties = new Map(invalidCssProperties);
      newInvalidCssProperties.set(cssPropertyName, defaultMapping);
      setInvalidCssProperties(newInvalidCssProperties);

      // 기본 매핑 반환
      return defaultMapping;
    }

    // 유효한 CSS 속성인 경우 그대로 반환
    return [cssPropertyName];
  };


  const generatePreview = () => {
    if (!fileStructure) {
      console.log('파일 구조가 없습니다. 파일을 업로드해주세요.');
      return '';
    }

    // 다중 파일 처리를 위한 준비
    const processAllFiles = async () => {
      if (taskType === 'jsonToCss' && files.length > 1) {
        // 모든 파일 로드
        for (let i = 0; i < files.length; i++) {
          if (i !== defaultFileId) { // 기본 파일이 아닌 경우에만 처리
            await new Promise<void>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                try {
                  const jsonData = JSON.parse(e.target?.result as string);
                  // 파일 ID와 데이터를 연결하여 저장
                  fileDataMap.set(i, jsonData);
                } catch (error) {
                  console.error(`파일 ${files[i].name} 파싱 중 오류:`, error);
                }
                resolve();
              };
              reader.readAsText(files[i]);
            });
          }
        }
      }
    };

    // 각 파일 데이터를 저장할 맵 생성
    const fileDataMap = new Map<number, any>();
    // 기본 파일은 이미 fileStructure에 로드되어 있으므로 맵에 추가
    if (defaultFileId !== null) {
      fileDataMap.set(defaultFileId, fileStructure);
    }

    // 모든 파일 처리 (비동기 처리 추가)
    let result = '';
    const processFiles = async () => {
      await processAllFiles();
      return generateCss();
    };

    // 비동기 함수를 즉시 실행
    processFiles().then(css => {
      setPreview(css);
    });

    // CSS 생성 함수
    const generateCss = async () => {
    console.log(`현재 작업 타입: ${taskType}`);

    if (taskType === 'jsonToCss') {
      // JSON to CSS 변환 로직 - 클래스 기반 변환
      // 각 클래스에 대한 속성을 모으기 위한 객체
      const classProperties: Record<string, Record<string, string>> = {};

      const collectProperties = (data: any, path: string[] = []) => {
        if (!data || typeof data !== 'object') return;

        // $type과 $value가 있는 경우 클래스와 속성 정보 수집
        if (data.$type && data.$value !== undefined) {
          if (path.length > 0) {
            // CSS 클래스 이름은 항상 전체 경로에서 생성 (마지막 속성 부분 제외)
            const className = transformKey(path.slice(0, -1).join(' '), keySpaceReplacer, lowercaseEnabled) || 'token-default';

            // CSS 속성 이름은 propertyPathDepth 설정에 따라 결정
            let propertyName;
            if (propertyPathDepth >= 99) {
              // 전체 경로 사용
              propertyName = transformKey(path.join(' '), keySpaceReplacer, lowercaseEnabled);
            } else {
              // 지정된 깊이만큼만 사용
              const propertyParts = path.slice(-propertyPathDepth);
              propertyName = transformKey(propertyParts.join(' '), keySpaceReplacer, lowercaseEnabled);
            }

            // CSS 속성 이름 변환
            const cssProperty = transformKey(propertyName, keySpaceReplacer, lowercaseEnabled);

            // 유효하지 않은 CSS 속성인 경우 매핑된 속성으로 대체
            const cssProperties = isValidCssProperty(cssProperty) 
              ? [cssProperty] 
              : (invalidCssProperties.get(cssProperty) || [cssProperty]);

            // 값 결정
            let propertyValue = data.$value;

            // CodeSyntax 사용 시 웹 값 우선 적용
            if (useCodeSyntax && data.$extensions?.['com.figma']?.codeSyntax) {
              const codeSyntax = data.$extensions['com.figma'].codeSyntax;
              if (codeSyntax.web) {
                propertyValue = codeSyntax.web;
              }
            }

            // 토큰 참조 변환 (예: {Color.Gray.100} -> var(--color-gray-100))
            if (typeof propertyValue === 'string' && propertyValue.startsWith('{') && propertyValue.endsWith('}')) {
              const tokenRef = propertyValue.substring(1, propertyValue.length - 1);
              const tokenPath = tokenRef.split('.').join('-').toLowerCase();
              propertyValue = `var(--${tokenPath})`;
            }

            // 클래스에 속성 추가
            if (!classProperties[className]) {
              classProperties[className] = {};
            }

            // 매핑된 모든 CSS 속성에 값 할당
            if (cssProperties.length > 0) {
              cssProperties.forEach(prop => {
                classProperties[className][prop] = propertyValue;
              });
            } else {
              // 매핑이 없는 경우 원래 속성 이름 사용
              classProperties[className][propertyName] = propertyValue;
            }
          }
        } else {
          // 객체 탐색
          Object.keys(data).forEach(key => {
            if (key.charAt(0) !== '$') { // $ 접두사가 없는 속성만 처리
              collectProperties(data[key], [...path, key]);
            }
          });
        }
      };

      // 다중 파일 처리
      if (files.length > 1 && fileConfigurations.length > 0) {
        // 각 파일별 처리 로직 추가
        result = `/* ${responsiveType === 'resolution' ? '해상도' : '테마'} 대응 CSS */\n\n`;

        // 기본 파일 처리
        if (defaultFileId !== null) {
          const defaultConfig = fileConfigurations.find(fc => fc.id === defaultFileId);
          if (defaultConfig && fileDataMap.get(defaultFileId)) {
            // 해상도 범위 계산
            let rangeText = '';
            if (responsiveType === 'resolution') {
              if (defaultConfig.minWidth && defaultConfig.maxWidth) {
                rangeText = `${defaultConfig.minWidth}px - ${defaultConfig.maxWidth}px`;
              } else if (defaultConfig.minWidth) {
                rangeText = `${defaultConfig.minWidth}px 이상`;
              } else if (defaultConfig.maxWidth) {
                rangeText = `${defaultConfig.maxWidth}px 이하`;
              } else {
                rangeText = '모든 해상도';
              }
            } else {
              rangeText = defaultConfig.config;
            }

            result += `/* 기본 스타일 - ${rangeText} */\n`;
            collectProperties(fileDataMap.get(defaultFileId));

            // 기본 CSS 클래스 생성
            let baseStyles = '';
            Object.keys(classProperties).forEach(className => {
              baseStyles += `.${className} {\n`;
              Object.keys(classProperties[className]).forEach(property => {
                baseStyles += `  ${property}: ${classProperties[className][property]};\n`;
              });
              baseStyles += `}\n\n`;
            });

            result += baseStyles;

            // 다른 파일들에 대한 미디어 쿼리 생성
            const otherConfigs = fileConfigurations.filter(fc => fc.id !== defaultFileId);

            for (const config of otherConfigs) {
              // 각 파일에 대한 설정 및 데이터 확인
              const fileData = fileDataMap.get(config.id);
              if (!fileData) continue;

              // 클래스 속성 초기화 (새 파일 속성 수집을 위해)
              const prevClassProperties = {...classProperties};
              Object.keys(classProperties).forEach(key => {
                delete classProperties[key];
              });

              // 이 파일의 속성 수집
              collectProperties(fileData);

              // 미디어 쿼리 헤더 생성
              if (responsiveType === 'resolution') {
                let mediaQueryCondition = '';

                if (config.minWidth && config.maxWidth) {
                  mediaQueryCondition = `(min-width: ${config.minWidth}px) and (max-width: ${config.maxWidth}px)`;
                } else if (config.minWidth) {
                  mediaQueryCondition = `(min-width: ${config.minWidth}px)`;
                } else if (config.maxWidth) {
                  mediaQueryCondition = `(max-width: ${config.maxWidth}px)`;
                }

                result += `\n@media ${mediaQueryCondition} {\n`;
                result += `  /* ${config.file.name} - ${config.minWidth || ''}${config.minWidth && config.maxWidth ? '-' : ''}${config.maxWidth || ''}px */\n`;
              } else {
                // 테마 모드 처리
                result += `\n/* 테마: ${config.config} */\n`;
                result += `[data-theme="${config.config.toLowerCase()}"] {\n`;
              }

              // 이 파일의 속성 추가
              Object.keys(classProperties).forEach(className => {
                if (responsiveType === 'resolution') {
                  result += `  .${className} {\n`;
                  Object.keys(classProperties[className]).forEach(property => {
                    result += `    ${property}: ${classProperties[className][property]};\n`;
                  });
                  result += `  }\n`;
                } else {
                  // 테마 모드에서는 중첩 선택자 사용
                  result += `  .${className} {\n`;
                  Object.keys(classProperties[className]).forEach(property => {
                    result += `    ${property}: ${classProperties[className][property]};\n`;
                  });
                  result += `  }\n`;
                }
              });

              // 미디어 쿼리 닫기
              if (responsiveType === 'resolution') {
                result += `}\n`;
              } else {
                result += `}\n`;
              }

              // 원래 속성 복원 (다음 파일 처리를 위해)
              Object.keys(classProperties).forEach(key => {
                delete classProperties[key];
              });
              Object.keys(prevClassProperties).forEach(key => {
                classProperties[key] = prevClassProperties[key];
              });
            }
          }
        }
      } else {
        // 단일 파일 처리
        collectProperties(fileStructure);

        // 수집된 속성을 CSS 클래스로 변환
        Object.keys(classProperties).forEach(className => {
          result += `.${className} {\n`;
          Object.keys(classProperties[className]).forEach(property => {
            result += `  ${property}: ${classProperties[className][property]};\n`;
          });
          result += `}\n\n`;
        });
      }

      // 단일 파일 처리일 경우 수집된 속성을 CSS 클래스로 변환하는 코드는 이제 위의 else 블록으로 이동했음
    } else if (taskType === 'jsonToToken') {
      try {
        console.log('jsonToToken 모드 시작');
        // Token 파싱 및 변환을 위해 TokenProperty 배열 생성
        const tokenProperties = extractTokenProperties(fileStructure, {
          separator: replaceSpace,
          keySpaceSeparator: keySpaceReplacer,
          lowercase: lowercaseEnabled,
          transformKeys: transformKeyNames
        });

        console.log(`추출된 토큰 속성 수: ${tokenProperties.length}`);

        // 형식 옵션 설정
        const formatOptions = {
          separator: replaceSpace,
          keySpaceSeparator: keySpaceReplacer,
          lowercase: lowercaseEnabled,
          customFormat: undefined, // JSON to Token에서는 커스텀 포맷 사용하지 않음
          useCodeSyntax: useCodeSyntax,
          outputFormat: tokenOutputFormat as 'cssVars' | 'plainJson',
          decimals: 4,  // 소수점 아래 4자리에서 반올림
          prefix: usePrefixEnabled ? variablePrefix : '--',  // 접두사 사용 설정에 따라 적용
          usePrefix: usePrefixEnabled, // 접두사 사용 여부
          propertyPathDepth: propertyPathDepth // 속성 경로 깊이 설정
        };

        // 토큰 생성
        result = generateJsonTokensAsCssVariables(tokenProperties, formatOptions);
        console.log('토큰 생성 완료');
      } catch (error) {
        console.error('토큰 변환 중 오류 발생:', error);
        result = `/* 토큰 변환 중 오류가 발생했습니다: ${error} */`;
      }
          } else if (taskType === 'tokenToToken') {
      try {
        console.log('tokenToToken 모드 시작');
        // Token 파싱 및 변환을 위해 TokenProperty 배열 생성
        const tokenProperties = extractTokenProperties(fileStructure, {
          separator: replaceSpace,
          keySpaceSeparator: keySpaceReplacer,
          lowercase: lowercaseEnabled,
          transformKeys: transformKeyNames
        });

        console.log(`추출된 토큰 속성 수: ${tokenProperties.length}`);

        // 형식 옵션 설정
        const formatOptions = {
          separator: replaceSpace,
          pathSeparator: pathSeparator,  // 경로 구분자 (점을 대체할 문자)
          spaceSeparator: keySpaceReplacer,  // 공백 대체 문자
          lowercase: lowercaseEnabled,
          useCodeSyntax: useCodeSyntax,
          decimals: 4,  // 소수점 아래 4자리에서 반올림
          targetPrefix: usePrefixEnabled ? variablePrefix : '--',  // 결과 토큰 접두사
          useTargetPrefix: usePrefixEnabled,  // 결과 토큰 접두사 사용 여부
          sourcePrefix: useSourcePrefixEnabled ? sourcePrefix : '--',  // 참조 토큰 접두사
          useSourcePrefix: useSourcePrefixEnabled,  // 참조 토큰 접두사 사용 여부
          propertyPathDepth: propertyPathDepth // 속성 경로 깊이 설정
        };

        // 토큰 변환
        result = generateTokenToToken(tokenProperties, formatOptions);
        console.log('토큰 변환 완료');
      } catch (error) {
        console.error('토큰 변환 중 오류 발생:', error);
        result = `/* 토큰 변환 중 오류가 발생했습니다: ${error} */`;
      }
    }

      // 결과가 비어있지 않은 경우에만 프리뷰 상태 업데이트
      if (result && result.length > 0) {
        console.log(`생성된 프리뷰 길이: ${result.length}`);
      } else {
        console.warn('생성된 프리뷰가 비어 있습니다.');
      }
      return result;
    };

    // 초기 실행 시 빈 문자열 반환 (실제 결과는 비동기로 설정됨)
    return '';
  };

      const handleDownload = async () => {
    // 프리뷰가 이미 생성되어 있으면 해당 내용 사용, 아니면 새로 생성
    let content = preview;
    if (!content) {
      // 동기식으로 처리하기 위해 별도 함수 생성 및 호출
      const generateAndProcess = async () => {
        const fileDataMap = new Map<number, any>();
        if (defaultFileId !== null) {
          fileDataMap.set(defaultFileId, fileStructure);
        }

        // 다른 파일들 처리
        if (taskType === 'jsonToCss' && files.length > 1) {
          for (let i = 0; i < files.length; i++) {
            if (i !== defaultFileId) {
              const fileContent = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = () => resolve('');
                reader.readAsText(files[i]);
              });

              try {
                if (fileContent) {
                  fileDataMap.set(i, JSON.parse(fileContent));
                }
              } catch (error) {
                console.error(`파일 ${files[i].name} 파싱 오류:`, error);
              }
            }
          }
        }

        // CSS 생성 로직 재구현 필요 (단축을 위해 프리뷰 사용)
        return preview || '/* 내용을 생성할 수 없습니다. */';
      };

      content = await generateAndProcess();
    }

    // 작업 유형에 따라 다른 파일 이름과 MIME 타입 설정
    let fileName = '';
    let mimeType = '';

    if (taskType === 'jsonToCss') {
      fileName = 'generated-styles.css';
      mimeType = 'text/css';
    } else if (taskType === 'jsonToToken') {
      // 토큰 출력 형식에 따라 파일 타입 결정
      if (tokenOutputFormat === 'cssVars') {
        fileName = 'token-variables.css';
        mimeType = 'text/css';
      } else {
        fileName = 'tokens.json';
        mimeType = 'application/json';
      }
    } else if (taskType === 'tokenToToken') {
      fileName = 'token-references.css';
      mimeType = 'text/css';
    } else {
      fileName = 'generated-output.txt';
      mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    // 다운로드 요소 추가, 클릭, 제거
    document.body.appendChild(a);
    a.click();

    // 정리 작업: URL 객체 해제 및 요소 제거
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <div className="parser-rule-container">
      {showPropertyMappingModal && (
        <InvalidCssPropertyDialog
          propertyName={currentPropertyToMap}
          initialMappings={invalidCssProperties.get(currentPropertyToMap) || []}
          onSave={handleSavePropertyMapping}
          onCancel={() => setShowPropertyMappingModal(false)}
        />
      )}

      <div className="section">
        <h2>1. 작업 선택</h2>
        <div className="option-group">
          <label>
            <input 
              type="radio" 
              name="taskType" 
              value="jsonToToken" 
              checked={taskType === 'jsonToToken'} 
              onChange={() => handleTaskTypeChange('jsonToToken')} 
            />
            JSON to Token
          </label>
          <label>
            <input 
              type="radio" 
              name="taskType" 
              value="tokenToToken" 
              checked={taskType === 'tokenToToken'} 
              onChange={() => handleTaskTypeChange('tokenToToken')} 
            />
            Token to Token
          </label>
          <label>
            <input 
              type="radio" 
              name="taskType" 
              value="jsonToCss" 
              checked={taskType === 'jsonToCss'} 
              onChange={() => handleTaskTypeChange('jsonToCss')} 
            />
            JSON to CSS
          </label>
          <label>
            <input 
              type="radio" 
              name="taskType" 
              value="cssIntegration" 
              checked={taskType === 'cssIntegration'} 
              onChange={() => handleTaskTypeChange('cssIntegration')} 
            />
            CSS 통합
          </label>
        </div>
      </div>

      <div className="section">
        <h2>2. 파일 업로드</h2>
        <div className="upload-options">
          <input 
            type="file" 
            multiple={taskType !== 'jsonToToken' && taskType !== 'tokenToToken'}
            onChange={handleFileUpload} 
            accept=".json"
          />
        </div>
        {files.length > 0 && (
          <div className="uploaded-files">
            <h3>업로드된 파일:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

              {fileStructure && (taskType === 'jsonToCss' || taskType === 'jsonToToken' || taskType === 'tokenToToken') && (
        <div className="section">
          <h2>3. 규칙 적용</h2>

          <div className="rule-option">
            <label>경로 연결 구분자: </label>
            <input 
              type="text" 
              value={replaceSpace} 
              onChange={(e) => setReplaceSpace(e.target.value)}
              maxLength={5}
            />
            <small>토큰 경로 요소를 연결할 때 사용합니다(예: color-blue-100)</small>
          </div>

          <div className="rule-option">
            <label>
              <input 
                type="checkbox" 
                checked={transformKeyNames} 
                onChange={(e) => setTransformKeyNames(e.target.checked)} 
              />
              속성 이름의 공백을 구분자로 변환
            </label>
            {transformKeyNames && (
              <div className="sub-option">
                <label>공백 대체 문자: </label>
                <input 
                  type="text" 
                  value={keySpaceReplacer} 
                  onChange={(e) => setKeySpaceReplacer(e.target.value)}
                  maxLength={5}
                />
                <small>예: 'Letter Spacing' → 'letter-spacing' (여기서 '-'가 대체 문자)</small>
              </div>
            )}
          </div>

          {taskType === 'tokenToToken' && (
            <div className="rule-option">
              <label>경로 구분자: </label>
              <input 
                type="text" 
                value={pathSeparator} 
                onChange={(e) => setPathSeparator(e.target.value)}
                maxLength={5}
              />
              <small>참조 토큰 경로의 점(.)을 대체할 문자입니다(예: Color.Gray.100 → color-gray-100)</small>
            </div>
          )}

          <div className="rule-option">
            <label>
              <input 
                type="checkbox" 
                checked={usePrefixEnabled} 
                onChange={(e) => setUsePrefixEnabled(e.target.checked)} 
              />
              {taskType === 'tokenToToken' ? '결과 토큰' : 'CSS 변수'} 접두사 사용
            </label>
            {usePrefixEnabled && (
              <div className="sub-option">
                <label>접두사: </label>
                <input 
                  type="text" 
                  value={variablePrefix} 
                  onChange={(e) => setVariablePrefix(e.target.value)}
                  placeholder="tgds"
                />
                <small>'--'는 자동으로 추가됩니다. 예: 'tgds'를 입력하면 '--tgds-color-blue-100'로 변환</small>
              </div>
            )}
          </div>

          {taskType === 'tokenToToken' && (
            <div className="rule-option">
              <label>
                <input 
                  type="checkbox" 
                  checked={useSourcePrefixEnabled} 
                  onChange={(e) => setUseSourcePrefixEnabled(e.target.checked)} 
                />
                참조 토큰 접두사 사용
              </label>
              {useSourcePrefixEnabled && (
                <div className="sub-option">
                  <label>참조 접두사: </label>
                  <input 
                    type="text" 
                    value={sourcePrefix} 
                    onChange={(e) => setSourcePrefix(e.target.value)}
                    placeholder="tgds"
                  />
                  <small>'--'는 자동으로 추가됩니다. 예: 'tgds'를 입력하면 var(--tgds-color-gray-100)</small>
                </div>
              )}
            </div>
          )}

          <div className="rule-option">
            <label>
              <input 
                type="checkbox" 
                checked={lowercaseEnabled} 
                onChange={(e) => setLowercaseEnabled(e.target.checked)} 
              />
              대문자를 소문자로 변환합니다.
            </label>
          </div>

          <div className="rule-option">
            <h3>CSS 변환 세부 설정</h3>

            <div className="sub-option">
              <label>속성 경로 깊이 설정:</label>
              <select 
                value={propertyPathDepth} 
                onChange={(e) => setPropertyPathDepth(parseInt(e.target.value))}
              >
                <option value="1">마지막 수준만 사용</option>
                <option value="2">마지막 2수준 사용</option>
                <option value="3">마지막 3수준 사용</option>
                <option value="99">전체 경로 사용</option>
              </select>
              <small>토큰 경로에서 어느 부분을 CSS 속성 이름 또는 변수로 사용할지 설정합니다.</small>
            </div>

            <div className="examples">
              <p>
                <strong>예시:</strong> Typography.Display 1.Font Size<br/>
                마지막 수준만 사용 → <code>{`.typography-display-1{font-size: ...}`}</code><br/>
                마지막 2수준 사용 → <code>{`.typography{display-1-font-size: ...}`}</code><br/>
                마지막 3수준 사용 → <code>{`.typography-display-1-font-size: ...`}</code>
              </p>
            </div>
          </div>

          {taskType === 'jsonToCss' && (
            <>
              <div className="sub-option">
                <label>출력 형식:</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="responsiveType"
                      value="resolution"
                      checked={responsiveType === 'resolution'}
                      onChange={() => setResponsiveType('resolution')}
                    />
                    해상도 대응
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="responsiveType"
                      value="theme"
                      checked={responsiveType === 'theme'}
                      onChange={() => setResponsiveType('theme')}
                    />
                    테마 대응
                  </label>
                </div>
              </div>

                {/* CSS 속성 검증 및 커스텀 적용 규칙 섹션 */}
                <div className="rule-option css-property-validation">
                  <h3>CSS 속성 검증 규칙</h3>
                  <p>JSON을 CSS로 변환할 때 속성 이름 검증 규칙을 설정합니다:</p>

                  <div className="validation-options">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={true} 
                        readOnly
                      />
                      css-keyword.json 파일의 속성 목록 사용
                    </label>
                    <p className="helper-text">업로드된 JSON의 속성 이름이 CSS 키워드 목록에 있는지 자동으로 확인합니다.</p>
                  </div>

                  <PropertyMappingList 
                    invalidProperties={invalidCssProperties} 
                    onEditMapping={openPropertyMappingDialog} 
                  />
                </div>

                {/* 유효하지 않은 CSS 속성 매핑 섹션 */}
                {invalidCssProperties.size > 0 && (
                  <div className="rule-option">
                    <h3>유효하지 않은 CSS 속성 매핑</h3>
                    <p>다음 속성들은 css-keyword.json에 정의되지 않은 속성입니다. 매핑할 속성을 설정해주세요:</p>

                    <div className="invalid-properties-list">
                      {Array.from(invalidCssProperties.keys()).map((propName) => {
                        const mappings = invalidCssProperties.get(propName) || [];
                        return (
                          <div key={propName} className="invalid-property-item">
                            <div className="invalid-property-name">{propName}</div>
                            <div>
                              {showPropertyMappingModal && (
                                <CustomCssPropertyForm
                                  propertyName={propName}
                                  initialMappings={mappings}
                                  onSave={(name, mappings) => {
                                    // 매핑 정보 업데이트
                                    const updatedMappings = new Map(invalidCssProperties);
                                    updatedMappings.set(name, mappings);
                                    setInvalidCssProperties(updatedMappings);

                                    // 커스텀 속성에 추가
                                    addCustomCssProperty(name, mappings);

                                    // 변경 내용 즉시 적용하여 프리뷰 업데이트
                                    setTimeout(() => generatePreview(), 100);
                                  }}
                                  onCancel={() => setShowPropertyMappingModal(false)}
                                />
                              )}
                              {!showPropertyMappingModal && (
                                <button 
                                  className="btn-property-mapping"
                                  onClick={() => setShowPropertyMappingModal(true)}
                                >
                                  속성 매핑 설정
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                        <div key={propName} className="invalid-property-item">
                          <div className="property-name">
                            <code>{propName}</code>
                            <div className="property-description">
                              {propName === 'padding-horizontal' && '좌우 패딩 (수평)을 한 번에 설정하기 위한 속성'}
                              {propName === 'padding-vertical' && '상하 패딩 (수직)을 한 번에 설정하기 위한 속성'}
                              {propName === 'margin-horizontal' && '좌우 마진 (수평)을 한 번에 설정하기 위한 속성'}
                              {propName === 'margin-vertical' && '상하 마진 (수직)을 한 번에 설정하기 위한 속성'}
                              {propName.includes('border-radius') && propName.includes('s') && 'Figma 디자인 토큰의 작은 테두리 반경'}
                              {propName.includes('border-radius') && propName.includes('m') && 'Figma 디자인 토큰의 중간 테두리 반경'}
                              {propName.includes('border-radius') && propName.includes('l') && 'Figma 디자인 토큰의 큰 테두리 반경'}
                            </div>
                          </div>
                          <div className="property-mapping">
                            <div className="mapping-field">
                              <input
                                type="text"
                                value={invalidCssProperties.get(propName)?.join(", ") || ""}
                                onChange={(e) => {
                                  const newInvalidCssProperties = new Map(invalidCssProperties);
                                  newInvalidCssProperties.set(
                                    propName, 
                                    e.target.value.split(",").map(m => m.trim()).filter(m => m)
                                  );
                                  setInvalidCssProperties(newInvalidCssProperties);
                                }}
                                placeholder="쉼표로 구분하여 대체 속성 입력 (예: padding-left, padding-right)"
                              />
                            </div>
                            <div className="mapping-suggestion">
                              {propName === 'padding-horizontal' && (
                                <button 
                                  className="suggestion-btn" 
                                  onClick={() => {
                                    const newInvalidCssProperties = new Map(invalidCssProperties);
                                    newInvalidCssProperties.set(propName, ['padding-left', 'padding-right']);
                                    setInvalidCssProperties(newInvalidCssProperties);
                                  }}
                                >
                                  padding-left, padding-right 사용
                                </button>
                              )}
                              {propName === 'padding-vertical' && (
                                <button 
                                  className="suggestion-btn" 
                                  onClick={() => {
                                    const newInvalidCssProperties = new Map(invalidCssProperties);
                                    newInvalidCssProperties.set(propName, ['padding-top', 'padding-bottom']);
                                    setInvalidCssProperties(newInvalidCssProperties);
                                  }}
                                >
                                  padding-top, padding-bottom 사용
                                </button>
                              )}
                              {propName === 'margin-horizontal' && (
                                <button 
                                  className="suggestion-btn" 
                                  onClick={() => {
                                    const newInvalidCssProperties = new Map(invalidCssProperties);
                                    newInvalidCssProperties.set(propName, ['margin-left', 'margin-right']);
                                    setInvalidCssProperties(newInvalidCssProperties);
                                  }}
                                >
                                  margin-left, margin-right 사용
                                </button>
                              )}
                              {propName === 'margin-vertical' && (
                                <button 
                                  className="suggestion-btn" 
                                  onClick={() => {
                                    const newInvalidCssProperties = new Map(invalidCssProperties);
                                    newInvalidCssProperties.set(propName, ['margin-top', 'margin-bottom']);
                                    setInvalidCssProperties(newInvalidCssProperties);
                                  }}
                                >
                                  margin-top, margin-bottom 사용
                                </button>
                              )}
                              {propName.includes('border') && propName.includes('radius') && (
                                <button 
                                  className="suggestion-btn" 
                                  onClick={() => {
                                    const newInvalidCssProperties = new Map(invalidCssProperties);
                                    newInvalidCssProperties.set(propName, ['border-radius']);
                                    setInvalidCssProperties(newInvalidCssProperties);
                                  }}
                                >
                                  border-radius 사용
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    </div>
                    <div className="add-custom-property">
                      <button 
                        className="add-custom-btn"
                        onClick={() => {
                          // 현재 사용자 정의 속성을 CSS 키워드에 추가하고 저장
                          const updatedCustomProperties = [...customCssProperties];
                          invalidCssProperties.forEach((mappedTo, name) => {
                            // 이미 존재하는지 확인
                            const existingIndex = updatedCustomProperties.findIndex(p => p.name === name);
                            if (existingIndex >= 0) {
                              // 업데이트
                              updatedCustomProperties[existingIndex].mappedTo = mappedTo;
                            } else {
                              // 새로 추가
                              updatedCustomProperties.push({
                                name, 
                                mappedTo, 
                                description: `사용자 정의 CSS 속성: ${name}`
                              });
                            }
                          });
                          setCustomCssProperties(updatedCustomProperties);
                          alert('사용자 정의 속성이 저장되었습니다!');
                        }}
                      >
                        사용자 정의 속성으로 저장
                      </button>
                      <p className="help-text">사용자 정의 속성으로 저장하면 이후 변환에서도 동일한 매핑이 적용됩니다.</p>
                    </div>
                  </div>
                )}

              {files.length > 1 && (
                <div className="rule-option">
                  <h3>다중 파일 설정</h3>
                  <p>각 파일에 대한 {responsiveType === 'resolution' ? '해상도' : '테마'} 설정:</p>

                  <div className="file-configurations">
                    {fileConfigurations.map((fileConfig, index) => (
                      <div key={fileConfig.id} className="file-config-item">
                        {/* 파일 순서 변경 버튼 */}
                        <div className="file-order-controls">
                          <button 
                            type="button" 
                            className="order-btn"
                            disabled={index === 0}
                            onClick={() => {
                              if (index > 0) {
                                const newConfigs = [...fileConfigurations];
                                const temp = newConfigs[index];
                                newConfigs[index] = newConfigs[index - 1];
                                newConfigs[index - 1] = temp;
                                setFileConfigurations(newConfigs);
                              }
                            }}
                          >↑</button>
                          <button 
                            type="button" 
                            className="order-btn"
                            disabled={index === fileConfigurations.length - 1}
                            onClick={() => {
                              if (index < fileConfigurations.length - 1) {
                                const newConfigs = [...fileConfigurations];
                                const temp = newConfigs[index];
                                newConfigs[index] = newConfigs[index + 1];
                                newConfigs[index + 1] = temp;
                                setFileConfigurations(newConfigs);
                              }
                            }}
                          >↓</button>
                        </div>

                        <span className="file-name">{fileConfig.file.name}</span>

                        {responsiveType === 'resolution' ? (
                          <div className="resolution-inputs">
                            <div className="resolution-input-group">
                              <label>최소:</label>
                              <input 
                                type="number" 
                                min="0"
                                value={fileConfig.minWidth || ''}
                                onChange={(e) => {
                                  const newConfigs = fileConfigurations.map(fc => 
                                    fc.id === fileConfig.id ? {...fc, minWidth: e.target.value ? parseInt(e.target.value) : undefined} : fc
                                  );
                                  setFileConfigurations(newConfigs);
                                }}
                                placeholder="예: 768"
                              />
                              <span>px</span>
                            </div>
                            <div className="resolution-input-group">
                              <label>최대:</label>
                              <input 
                                type="number" 
                                min="0"
                                value={fileConfig.maxWidth || ''}
                                onChange={(e) => {
                                  const newConfigs = fileConfigurations.map(fc => 
                                    fc.id === fileConfig.id ? {...fc, maxWidth: e.target.value ? parseInt(e.target.value) : undefined} : fc
                                  );
                                  setFileConfigurations(newConfigs);
                                }}
                                placeholder="예: 1439"
                              />
                              <span>px</span>
                            </div>
                          </div>
                        ) : (
                          <input 
                            type="text" 
                            value={fileConfig.config}
                            onChange={(e) => {
                              const newConfigs = fileConfigurations.map(fc => 
                                fc.id === fileConfig.id ? {...fc, config: e.target.value} : fc
                              );
                              setFileConfigurations(newConfigs);
                            }}
                            placeholder="예: dark"
                          />
                        )}

                        <label className="default-file-label">
                          <input 
                            type="radio" 
                            name="defaultFile"
                            checked={defaultFileId === fileConfig.id}
                            onChange={() => setDefaultFileId(fileConfig.id)}
                          />
                          기본값으로 사용
                        </label>
                      </div>
                    ))}
                  </div>

                  {responsiveType === 'resolution' && (
                    <div className="resolution-info">
                      <h4>현재 해상도 범위:</h4>
                      <ul className="resolution-ranges">
                        {fileConfigurations.map((fileConfig) => {
                          // 해상도 범위 계산 로직
                          let rangeText = '';
                          if (fileConfig.minWidth && fileConfig.maxWidth) {
                            rangeText = `${fileConfig.minWidth}px - ${fileConfig.maxWidth}px`;
                          } else if (fileConfig.minWidth) {
                            rangeText = `${fileConfig.minWidth}px 이상`;
                          } else if (fileConfig.maxWidth) {
                            rangeText = `${fileConfig.maxWidth}px 이하`;
                          } else {
                            // 자동 범위 계산
                            const otherConfigs = fileConfigurations.filter(fc => fc.id !== fileConfig.id);
                            const lowerBounds = otherConfigs.filter(fc => fc.maxWidth).map(fc => fc.maxWidth);
                            const upperBounds = otherConfigs.filter(fc => fc.minWidth).map(fc => fc.minWidth);

                            if (lowerBounds.length > 0 && upperBounds.length > 0) {
                              const maxLower = Math.max(...lowerBounds.map(b => b || 0)) + 1;
                              const minUpper = Math.min(...upperBounds.map(b => b || Infinity)) - 1;
                              if (maxLower <= minUpper) {
                                rangeText = `${maxLower}px - ${minUpper}px (자동)`;
                              } else {
                                rangeText = '범위를 수동으로 지정해주세요';
                              }
                            } else if (lowerBounds.length > 0) {
                              const maxLower = Math.max(...lowerBounds.map(b => b || 0));
                              rangeText = `${maxLower + 1}px 이상 (자동)`;
                            } else if (upperBounds.length > 0) {
                              const minUpper = Math.min(...upperBounds.map(b => b || Infinity));
                              rangeText = `${minUpper - 1}px 이하 (자동)`;
                            } else {
                              rangeText = '모든 해상도';
                            }
                          }

                          return (
                            <li key={fileConfig.id} className={defaultFileId === fileConfig.id ? 'default-file' : ''}>
                              <strong>{fileConfig.file.name}:</strong> {rangeText}
                              {defaultFileId === fileConfig.id && ' (기본값)'}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <small className="multi-file-help">
                    {responsiveType === 'resolution' 
                      ? '해상도 범위를 지정하세요. 값을 비워두면 자동으로 계산됩니다.' 
                      : '테마 이름을 지정하세요 (예: "light", "dark")'}
                  </small>
                </div>
              )}
            </>
          )}
          

  const detectCustomProperties = (css: string, keywords: string[]) => {
    // CSS 규칙 추출 정규식 - 중첩된 중괄호 처리를 위해 수정
    const ruleRegex = /([^{}]+)\s*\{\s*([^{}]*)\s*\}/g;
    const propertyRegex = /([\w-]+)\s*:\s*([^;]+);?/g;

    const detected = new Set<string>();
    const customPropsArray = customCssProperties;
    const existing = new Set(customPropsArray.map(p => p.name));

    // CSS 규칙 추출
    let ruleMatch;
    while ((ruleMatch = ruleRegex.exec(css)) !== null) {
      const ruleBody = ruleMatch[2];

      // 규칙 내의 속성 추출
      let propertyMatch;
      while ((propertyMatch = propertyRegex.exec(ruleBody)) !== null) {
        const propName = propertyMatch[1].trim();

        // 표준 CSS 속성이 아니고 이미 등록된 사용자 정의 속성도 아닌 경우 추가
        if (!keywords.includes(propName) && !propName.startsWith('--') && !existing.has(propName)) {
          detected.add(propName);
        }
      }
    }

    return detected.size > 0;
  };

  const detected = new Set<string>();
  const existing = new Set(customPropsArray.map(p => p.name));

  // CSS 규칙 추출
  let ruleMatch;
  while ((ruleMatch = ruleRegex.exec(css)) !== null) {
    const ruleBody = ruleMatch[2];

    // 규칙 내의 속성 추출
    let propertyMatch;
    while ((propertyMatch = propertyRegex.exec(ruleBody)) !== null) {
      const propName = propertyMatch[1].trim();

      // 표준 CSS 속성이 아니고 이미 등록된 사용자 정의 속성도 아닌 경우 추가
      if (!keywords.includes(propName) && !propName.startsWith('--') && !existing.has(propName)) {
        detected.add(propName);
      }
    }
  }

  return detected.size > 0;
};

// 사용자 정의 속성 검출 및 다이얼로그 표시 결정
const cssResult = preview;
if (cssResult && detectCustomProperties(cssResult, cssKeywords)) {
  setDetectedCssText(cssResult);
  setShowPropertyDetectionDialog(true);
}

          <div className="rule-option">
            <h3>어떤 값을 {taskType === 'jsonToCss' ? '속성' : '토큰'}으로 변환할지 선택</h3>
            <label>
              <input 
                type="checkbox" 
                checked={selectedAttributes.includes('$value')} 
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAttributes([...selectedAttributes, '$value']);
                  } else {
                    setSelectedAttributes(selectedAttributes.filter(attr => attr !== '$value'));
                  }
                }} 
              />
              $value
            </label>

            {hasCodeSyntax && (
              <label>
                <input 
                  type="checkbox" 
                  checked={useCodeSyntax} 
                  onChange={(e) => setUseCodeSyntax(e.target.checked)} 
                />
                codeSyntax
              </label>
            )}

            {(taskType === 'jsonToToken' || taskType === 'tokenToToken') && (
              <div className="token-output-format">
                <h4>출력 형식 선택:</h4>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name="tokenOutputFormat"
                      value="cssVars"
                      checked={tokenOutputFormat === 'cssVars'}
                      onChange={() => setTokenOutputFormat('cssVars')}
                    />
                    CSS 변수 형식 (:root 내부)
                  </label>
                  {taskType === 'jsonToToken' && (
                    <label>
                      <input
                        type="radio"
                        name="tokenOutputFormat"
                        value="plainJson"
                        checked={tokenOutputFormat === 'plainJson'}
                        onChange={() => setTokenOutputFormat('plainJson')}
                      />
                      중첩된 JSON 형식
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

              {/* CSS 추가 스타일 */}
              <style jsx>{`
                .invalid-properties-list {
                  margin-top: 10px;
                }

                .invalid-property-item {
                  display: flex;
                  align-items: flex-start;
                  margin-bottom: 12px;
                  padding: 12px;
                  background-color: #f8f8f8;
                  border-radius: 6px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }

                .property-name {
                  width: 200px;
                  margin-right: 15px;
                }

                .property-name code {
                  background-color: #e0e0e0;
                  padding: 2px 5px;
                  border-radius: 3px;
                  font-family: monospace;
                  display: inline-block;
                  margin-bottom: 4px;
                }

                .property-description {
                  font-size: 12px;
                  color: #666;
                  margin-top: 5px;
                  line-height: 1.4;
                }

                .property-mapping {
                  flex: 1;
                  display: flex;
                  flex-direction: column;
                }

                .mapping-field {
                  margin-bottom: 8px;
                }

                .property-mapping input {
                  width: 100%;
                  padding: 8px;
                  border: 1px solid #ddd;
                  border-radius: 4px;
                  font-family: monospace;
                }

                .mapping-suggestion {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 5px;
                }

                .suggestion-btn {
                  background-color: #e8f0fe;
                  border: 1px solid #c0d6f9;
                  color: #0366d6;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 13px;
                  cursor: pointer;
                }

                .suggestion-btn:hover {
                  background-color: #d1e5fc;
                }

                .add-custom-property {
                  margin-top: 20px;
                  padding: 15px;
                  background-color: #f0f7ff;
                  border-radius: 6px;
                  border: 1px dashed #80bdff;
                  text-align: center;
                }

                .add-custom-btn {
                  background-color: #0366d6;
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 4px;
                  cursor: pointer;
                  font-weight: bold;
                }

                .add-custom-btn:hover {
                  background-color: #0256b9;
                }

                .help-text {
                  font-size: 12px;
                  color: #666;
                  margin-top: 8px;
                }

              /* 모달 스타일 */
              .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
              }

              .modal-content {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 24px;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
              }

              .modal-content h3 {
                margin-top: 0;
                color: #333;
                border-bottom: 1px solid #eee;
                padding-bottom: 12px;
              }

              .invalid-properties-modal-list {
                margin: 16px 0;
                max-height: 60vh;
                overflow-y: auto;
                padding-right: 10px;
              }

              .invalid-property-modal-item {
                margin-bottom: 16px;
                padding: 12px;
                background-color: #f8f9fa;
                border-radius: 6px;
                border: 1px solid #e9ecef;
              }

              .property-modal-name {
                margin-bottom: 8px;
              }

              .property-modal-name code {
                background-color: #e0e0e0;
                padding: 3px 6px;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
              }

              .mapping-options {
                display: flex;
                flex-direction: column;
                gap: 8px;
              }

              .mapping-options label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                padding: 6px;
                border-radius: 4px;
              }

              .mapping-options label:hover {
                background-color: #f0f0f0;
              }

              .custom-mapping-input {
                margin-top: 8px;
                display: flex;
                flex-direction: column;
                gap: 4px;
              }

              .custom-mapping-input label {
                font-weight: bold;
                font-size: 12px;
                color: #666;
              }

              .custom-mapping-input input {
                padding: 8px;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: monospace;
              }

              .modal-actions {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                margin-top: 20px;
                border-top: 1px solid #eee;
                padding-top: 16px;
              }

              .save-and-proceed-btn {
                background-color: #0366d6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
              }

              .save-and-proceed-btn:hover {
                background-color: #0256b9;
              }

              .cancel-btn {
                background-color: #e9ecef;
                color: #495057;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
              }

              .cancel-btn:hover {
                background-color: #dee2e6;
              }
              `}</style>

        {/* 유효하지 않은 CSS 속성 매핑 확인 모달 */}
              {showPropertyMappingModal && invalidCssProperties.size > 0 && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>유효하지 않은 CSS 속성 매핑 확인</h3>
            <p>다음 속성들은 CSS에서 직접 사용할 수 없는 속성입니다. 변환 방법을 지정해주세요:</p>

            <div className="invalid-properties-modal-list">
              {Array.from(invalidCssProperties.keys()).map((propName) => (
                <div key={propName} className="invalid-property-modal-item">
                  <div className="property-modal-name">
                    <code>{propName}</code>
                  </div>
                  <div className="property-modal-mapping">
                    <div className="mapping-options">
                      {propName === 'padding-horizontal' && (
                        <>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'padding-left,padding-right'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['padding-left', 'padding-right']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            padding-left, padding-right로 변환
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'padding'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['padding']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            padding으로 변환 (좌우 값만 사용)
                          </label>
                        </>
                      )}
                      {propName === 'padding-vertical' && (
                        <>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'padding-top,padding-bottom'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['padding-top', 'padding-bottom']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            padding-top, padding-bottom으로 변환
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'padding'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['padding']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            padding으로 변환 (상하 값만 사용)
                          </label>
                        </>
                      )}
                      {propName === 'margin-horizontal' && (
                        <>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'margin-left,margin-right'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['margin-left', 'margin-right']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            margin-left, margin-right로 변환
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'margin'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['margin']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            margin으로 변환 (좌우 값만 사용)
                          </label>
                        </>
                      )}
                      {propName === 'margin-vertical' && (
                        <>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'margin-top,margin-bottom'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['margin-top', 'margin-bottom']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            margin-top, margin-bottom으로 변환
                          </label>
                          <label>
                            <input 
                              type="radio" 
                              name={`mapping-${propName}`}
                              checked={invalidCssProperties.get(propName)?.join(',') === 'margin'}
                              onChange={() => {
                                const newInvalidCssProperties = new Map(invalidCssProperties);
                                newInvalidCssProperties.set(propName, ['margin']);
                                setInvalidCssProperties(newInvalidCssProperties);
                              }}
                            />
                            margin으로 변환 (상하 값만 사용)
                          </label>
                        </>
                      )}
                      {/* 사용자 정의 입력 */}
                      <div className="custom-mapping-input">
                        <label>사용자 정의:</label>
                        <input
                          type="text"
                          value={invalidCssProperties.get(propName)?.join(", ") || ""}
                          onChange={(e) => {
                            const newInvalidCssProperties = new Map(invalidCssProperties);
                            newInvalidCssProperties.set(
                              propName, 
                              e.target.value.split(",").map(m => m.trim()).filter(m => m)
                            );
                            setInvalidCssProperties(newInvalidCssProperties);
                          }}
                          placeholder="쉼표로 구분하여 대체 속성 입력 (예: padding-left, padding-right)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button 
                className="save-and-proceed-btn"
                onClick={() => {
                  // 현재 사용자 정의 속성을 CSS 키워드에 추가하고 저장
                  const updatedCustomProperties = [...customCssProperties];
                  invalidCssProperties.forEach((mappedTo, name) => {
                    // 이미 존재하는지 확인
                    const existingIndex = updatedCustomProperties.findIndex(p => p.name === name);
                    if (existingIndex >= 0) {
                      // 업데이트
                      updatedCustomProperties[existingIndex].mappedTo = mappedTo;
                    } else {
                      // 새로 추가
                      updatedCustomProperties.push({
                        name, 
                        mappedTo, 
                        description: `사용자 정의 CSS 속성: ${name}`
                      });
                    }
                  });
                  setCustomCssProperties(updatedCustomProperties);
                  setShowPropertyMappingModal(false);
                  // 프리뷰 생성
                  generatePreview();
                }}
              >
                저장하고 계속하기
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowPropertyMappingModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
              )}

              {fileStructure && (
        <div className="section">
          <h2>4. 프리뷰 및 다운로드</h2>
          <button onClick={() => {
            // 유효하지 않은 CSS 속성이 있을 경우 모달 표시
            if (invalidCssProperties.size > 0) {
              setShowPropertyMappingModal(true);
            } else {
              // 없으면 바로 프리뷰 생성
              generatePreview();
            }
          }}>프리뷰 생성</button>

          {preview ? (
            <div className="preview-container">
              <h3>프리뷰:</h3>
              <pre className="preview-content">{preview}</pre>
              <button onClick={handleDownload}>다운로드</button>
            </div>
          ) : (
            <div className="preview-container">
              <p>프리뷰가 생성되지 않았습니다. 파일을 업로드하고 프리뷰 생성 버튼을 클릭하세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParserRule;
