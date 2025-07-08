/**
 * Parser 관련 유틸리티 함수들
 */

/**
 * 유효한 CSS 속성 목록
 * 가장 일반적으로 사용되는 CSS 속성들의 목록입니다.
 */
export const validCssProperties = [
  'align-content', 'align-items', 'align-self', 'animation', 'animation-delay', 'animation-direction',
  'animation-duration', 'animation-fill-mode', 'animation-iteration-count', 'animation-name',
  'animation-play-state', 'animation-timing-function', 'backface-visibility', 'background',
  'background-attachment', 'background-blend-mode', 'background-clip', 'background-color',
  'background-image', 'background-origin', 'background-position', 'background-repeat',
  'background-size', 'border', 'border-bottom', 'border-bottom-color', 'border-bottom-left-radius',
  'border-bottom-right-radius', 'border-bottom-style', 'border-bottom-width', 'border-collapse',
  'border-color', 'border-image', 'border-image-outset', 'border-image-repeat', 'border-image-slice',
  'border-image-source', 'border-image-width', 'border-left', 'border-left-color', 'border-left-style',
  'border-left-width', 'border-radius', 'border-right', 'border-right-color', 'border-right-style',
  'border-right-width', 'border-spacing', 'border-style', 'border-top', 'border-top-color',
  'border-top-left-radius', 'border-top-right-radius', 'border-top-style', 'border-top-width',
  'border-width', 'bottom', 'box-shadow', 'box-sizing', 'caption-side', 'clear', 'clip', 'color',
  'column-count', 'column-fill', 'column-gap', 'column-rule', 'column-rule-color', 'column-rule-style',
  'column-rule-width', 'column-span', 'column-width', 'columns', 'content', 'counter-increment',
  'counter-reset', 'cursor', 'direction', 'display', 'empty-cells', 'filter', 'flex', 'flex-basis',
  'flex-direction', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap', 'float', 'font', 'font-family',
  'font-size', 'font-size-adjust', 'font-stretch', 'font-style', 'font-variant', 'font-weight',
  'gap', 'grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows',
  'grid-column', 'grid-column-end', 'grid-column-gap', 'grid-column-start', 'grid-gap',
  'grid-row', 'grid-row-end', 'grid-row-gap', 'grid-row-start', 'grid-template',
  'grid-template-areas', 'grid-template-columns', 'grid-template-rows', 'height', 'justify-content',
  'left', 'letter-spacing', 'line-height', 'list-style', 'list-style-image', 'list-style-position',
  'list-style-type', 'margin', 'margin-bottom', 'margin-left', 'margin-right', 'margin-top',
  'max-height', 'max-width', 'min-height', 'min-width', 'object-fit', 'object-position', 'opacity',
  'order', 'outline', 'outline-color', 'outline-offset', 'outline-style', 'outline-width',
  'overflow', 'overflow-x', 'overflow-y', 'padding', 'padding-bottom', 'padding-left',
  'padding-right', 'padding-top', 'page-break-after', 'page-break-before', 'page-break-inside',
  'perspective', 'perspective-origin', 'pointer-events', 'position', 'quotes', 'resize',
  'right', 'tab-size', 'table-layout', 'text-align', 'text-align-last', 'text-decoration',
  'text-decoration-color', 'text-decoration-line', 'text-decoration-style', 'text-indent',
  'text-justify', 'text-overflow', 'text-shadow', 'text-transform', 'top', 'transform',
  'transform-origin', 'transform-style', 'transition', 'transition-delay', 'transition-duration',
  'transition-property', 'transition-timing-function', 'vertical-align', 'visibility',
  'white-space', 'width', 'word-break', 'word-spacing', 'word-wrap', 'writing-mode', 'z-index'
];

/**
 * 주어진 속성이 유효한 CSS 속성인지 확인합니다.
 * @param property 확인할 CSS 속성 이름
 * @param cssKeywords CSS 키워드 목록 (옵션)
 * @param customProperties 사용자 정의 속성 목록 (옵션)
 * @returns 유효한 CSS 속성인 경우 true, 아니면 false
 */
export const isValidCssProperty = (property: string, cssKeywords?: string[], customProperties?: Array<{name: string, mappedTo: string[], description?: string}>): boolean => {
  try {
    // 인자로 전달된 키워드 목록이 있으면 사용, 없으면 캐시된 목록 확인
    const keywords = cssKeywords || (cssKeywordsCache || validCssProperties);
    // 표준 CSS 속성인지 확인
    if (keywords.includes(property.toLowerCase())) {
      return true;
    }

      // 4. 벤더 프리픽스가 붙은 속성인지 확인 (-webkit-, -moz-, -ms-, -o-)
      if (/^(-webkit-|-moz-|-ms-|-o-)/.test(property)) {
        // 프리픽스를 제거한 속성명이 유효한지 확인
        const unprefixedName = property.replace(/^(-webkit-|-moz-|-ms-|-o-)/, '');
        return keywords.includes(unprefixedName);
      }

    // 사용자 정의 속성 목록 사용
    const customProps = customProperties || getCustomCssProperties();
    // 사용자 정의 속성인지 확인
    const isCustomProperty = customProps.some(prop => prop.name.toLowerCase() === property.toLowerCase());
    if (isCustomProperty) {
      return true;
    }

    // 하드코딩된 사용자 정의 속성 목록 확인 (기본값)
    const hardcodedCustomProperties = ['padding-horizontal', 'padding-vertical', 'margin-horizontal', 'margin-vertical'];
    return hardcodedCustomProperties.includes(property.toLowerCase());
  } catch (error) {
    // 외부 파일 로드에 실패한 경우 기존 하드코딩된 목록 사용
    console.error('CSS 키워드 로드 실패, 내장 목록 사용:', error);
    // 하드코딩된 사용자 정의 속성 목록 확인
    const hardcodedCustomProperties = ['padding-horizontal', 'padding-vertical', 'margin-horizontal', 'margin-vertical'];
    return validCssProperties.includes(property.toLowerCase()) || hardcodedCustomProperties.includes(property.toLowerCase());
  }
};

// CSS 키워드 캐시
let cssKeywordsCache: string[] | null = null;

// 사용자 정의 CSS 속성 캐시
let customCssPropertiesCache: Array<{name: string, mappedTo: string[], description?: string}> | null = null;

/**
 * 사용자 정의 CSS 속성 목록을 가져옵니다.
 * @returns 사용자 정의 CSS 속성 배열
 */
export const getCustomCssProperties = (): Array<{name: string, mappedTo: string[], description?: string}> => {
  // 캐시된 목록이 있으면 반환
  if (customCssPropertiesCache) {
    return customCssPropertiesCache;
  }

  // 기본 사용자 정의 속성 목록
  const defaultProperties = [
    { name: 'padding-horizontal', mappedTo: ['padding-left', 'padding-right'], description: '좌우 패딩을 한 번에 설정하기 위한 속성' },
    { name: 'padding-vertical', mappedTo: ['padding-top', 'padding-bottom'], description: '상하 패딩을 한 번에 설정하기 위한 속성' },
    { name: 'margin-horizontal', mappedTo: ['margin-left', 'margin-right'], description: '좌우 마진을 한 번에 설정하기 위한 속성' },
    { name: 'margin-vertical', mappedTo: ['margin-top', 'margin-bottom'], description: '상하 마진을 한 번에 설정하기 위한 속성' }
  ];

  try {
    // 로컬 스토리지에서 사용자 정의 속성 로드 시도
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedProperties = localStorage.getItem('customCssProperties');
      if (savedProperties) {
        try {
          const parsedProperties = JSON.parse(savedProperties);
          customCssPropertiesCache = [...defaultProperties, ...parsedProperties];
          return customCssPropertiesCache;
        } catch (error) {
          console.error('저장된 사용자 정의 CSS 속성 파싱 실패:', error);
        }
      }
    }
  } catch (error) {
    console.error('로컬 스토리지 접근 중 오류:', error);
  }

  // 캐시 설정 및 기본값 반환
  customCssPropertiesCache = defaultProperties;
  return customCssPropertiesCache;
};

/**
 * 사용자 정의 CSS 속성을 저장합니다.
 * @param properties 저장할 사용자 정의 CSS 속성 배열
 */
export const saveCustomCssProperties = (properties: Array<{name: string, mappedTo: string[], description?: string}>): void => {
  // 캐시 업데이트
  customCssPropertiesCache = properties;

  // 로컬 스토리지에 저장 시도
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 기본 속성 제외하고 저장 (중복 방지)
      const defaultNames = ['padding-horizontal', 'padding-vertical', 'margin-horizontal', 'margin-vertical'];
      const customProperties = properties.filter(p => !defaultNames.includes(p.name));

      localStorage.setItem('customCssProperties', JSON.stringify(customProperties));
    }
  } catch (error) {
    console.error('사용자 정의 CSS 속성 저장 중 오류:', error);
  }
};

/**
 * CSS 키워드 목록을 가져옵니다.
 * @returns CSS 키워드 배열
 */
export const getCssKeywords = async (): Promise<string[]> => {
  // 캐시된 목록이 있으면 반환
  if (cssKeywordsCache) {
    return cssKeywordsCache;
  }

  try {
    // 외부 JSON 파일에서 CSS 키워드 로드 (동적 import 사용)
    try {
      const keywordsModule = await import('../data/css-keywords.json');
      cssKeywordsCache = keywordsModule.default;
      return cssKeywordsCache;
    } catch (moduleError) {
      // css-keywords.json 파일이 없는 경우 css-keyword.json 시도
      console.warn('css-keywords.json 로드 실패, css-keyword.json 시도:', moduleError);
      const fallbackModule = await import('../data/css-keyword.json');
      cssKeywordsCache = fallbackModule.default;
      return cssKeywordsCache;
    }
  } catch (error) {
    console.error('CSS 키워드 파일 로드 실패:', error);
    // 실패 시 내장 목록 사용
    cssKeywordsCache = validCssProperties;
    return cssKeywordsCache;
  }
};

/**
 * 속성 이름의 공백을 지정된 분리자로 변환합니다.
 * @param key 변환할 속성 이름
 * @param separator 사용할 분리자 (기본값: '-')
 * @param lowercase 소문자로 변환할지 여부 (기본값: true)
 * @returns 변환된 속성 이름
 */
export const transformKey = (key: string, separator: string = '-', lowercase: boolean = true): string => {
  // 공백을 지정된 분리자로 변환
  let transformed = key.replace(/\s+/g, separator);

  // 필요한 경우 소문자로 변환
  if (lowercase) {
    transformed = transformed.toLowerCase();
  }

  return transformed;
};

/**
 * 숫자 값의 소수점 자리수를 제한합니다.
 * @param value 값(문자열 또는 숫자)
 * @param decimals 소수점 자리수 (기본값: 4)
 * @returns 포맷된 값
 */
export const formatNumberValue = (value: string | number, decimals: number = 4): string => {
  // 값이 숫자인지 확인
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return String(value); // 숫자로 변환할 수 없으면 원래 값 반환
  }

  // CSS 값에서 단위 추출 (예: '10px', '1.5rem')
  if (typeof value === 'string') {
    const match = value.match(/^([\d.]+)(.*)$/);
    if (match) {
      const number = parseFloat(match[1]);
      const unit = match[2];
      return number.toFixed(decimals).replace(/\.?0+$/, '') + unit;
    }
  }

  // 단순 숫자인 경우 소수점 아래 자리수 제한
  return numericValue.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * JSON 데이터에서 변수 이름과 속성을 추출합니다.
 */
export interface TokenProperty {
  path: string[];
  fullPath: string;
  type: string;
  value: string;
  description?: string;
  extensions?: any;
  hasCodeSyntax: boolean;
  codeSyntaxValues?: Record<string, any>;
  propertyInfo?: {
    name: string;
    isCustomCssProperty: boolean;
  };
}

/**
 * JSON 데이터에서 모든 토큰 속성을 추출합니다.
 */
export const extractTokenProperties = (data: any, options?: {
  separator?: string;
  keySpaceSeparator?: string;
  lowercase?: boolean;
  transformKeys?: boolean;
}): TokenProperty[] => {
  const properties: TokenProperty[] = [];
  const separator = options?.separator || '-';
  const keySpaceSeparator = options?.keySpaceSeparator || '-';
  const lowercase = options?.lowercase !== undefined ? options.lowercase : true;
  const transformKeys = options?.transformKeys !== undefined ? options.transformKeys : true;

  const extract = (obj: any, path: string[] = []) => {
    if (!obj || typeof obj !== 'object') return;

    if (obj.$type && obj.$value) {
      // 유효한 디자인 토큰 속성 발견
      const hasCodeSyntax = !!(
        obj.$extensions?.['com.figma']?.codeSyntax && 
        Object.keys(obj.$extensions?.['com.figma']?.codeSyntax).length > 0
      );

      // 원래 객체에서 추가 정보 확인 (유효하지 않은 CSS 속성에 대한 처리를 위해)
      const lastPathItem = path.length > 0 ? path[path.length - 1] : '';
      const propertyInfo = {
          name: lastPathItem,
          isCustomCssProperty: !getCssKeywords().includes(lastPathItem.toLowerCase())
      };

      properties.push({
          path: [...path],
          fullPath: path.join('.'),
          type: obj.$type,
          value: obj.$value,
          description: obj.$description,
          extensions: obj.$extensions,
          hasCodeSyntax,
          codeSyntaxValues: hasCodeSyntax ? obj.$extensions?.['com.figma']?.codeSyntax : undefined,
          propertyInfo
      });
    } else {
      // 객체를 더 깊이 탐색
      Object.keys(obj).forEach(key => {
        if (key.charAt(0) !== '$') { // $ 접두사가 없는 속성만 처리
          // 키 이름에 공백이 있으면 변환 (예: 'Letter Spacing' -> 'letter-spacing')
          const processedKey = transformKeys ? transformKey(key, keySpaceSeparator, lowercase) : key;
          extract(obj[key], [...path, processedKey]);
        }
      });
          }
  };

  extract(data);
  return properties;
};

/**
 * 변수 이름을 CSS 변수 형식으로 변환합니다.
 */
export const transformToCssVariableName = (
  property: TokenProperty, 
  options: {
    separator: string;
    lowercase: boolean;
    customFormat?: string[];
    prefix?: string;
    usePrefix?: boolean;
    propertyPathDepth?: number;
  }
): string => {
  const { separator, lowercase, customFormat, prefix = '--', propertyPathDepth = 99 } = options;

  // 경로 깊이 설정에 따라 처리
  let pathParts;
  if (propertyPathDepth >= 99) {
    // 전체 경로 사용
    pathParts = [...property.path];
  } else {
    // 마지막 N개의 경로 요소만 사용
    pathParts = property.path.slice(-propertyPathDepth);
  }

  // 경로 요소를 구분자로 결합
  let result = pathParts.join(separator);

  // 소문자 변환 적용
  if (lowercase) {
    result = result.toLowerCase();
  }

  // 커스텀 포맷이 지정된 경우 적용
  if (customFormat && customFormat.length > 0) {
    // 커스텀 포맷 적용 로직
    result = customFormat.join(separator);
    if (lowercase) {
      result = result.toLowerCase();
    }
  }

  // 접두사 처리
  if (options.usePrefix && prefix !== '--') {
    // 사용자 지정 접두사 추가
    // 접두사가 '--'로 시작하지 않으면 자동으로 추가
    const formattedPrefix = prefix.startsWith('--') ? prefix : `--${prefix}`;
    // 접두사와 결과 사이에 구분자 추가 (접두사가 끝에 구분자가 없는 경우만)
    const needsSeparator = !formattedPrefix.endsWith(separator);

    return `${formattedPrefix}${needsSeparator ? separator : ''}${result}`;
  } else {
    // 기본 CSS 변수 접두사 사용
    return `--${result}`;
  }
};

/**
 * 토큰 이름을 형식에 맞게 변환합니다.
 */
export const transformTokenName = (
  path: string[],
  options: {
    separator: string;
    lowercase: boolean;
    customFormat?: string[];
    prefix?: string;
    usePrefix?: boolean;
    propertyPathDepth?: number;
  }
): string => {
  const { separator, lowercase, customFormat, prefix = '--', usePrefix = false, propertyPathDepth = 99 } = options;
  const effectivePrefix = usePrefix && prefix !== '--' ? 
    (prefix.startsWith('--') ? prefix : `--${prefix}`) : 
    '--';

  // 커스텀 포맷 적용
  if (customFormat && customFormat.length > 0) {
    let result = customFormat.join(separator);
    if (lowercase) {
      result = result.toLowerCase();
    }

    // 접두사 적용
    if (usePrefix && prefix !== '--') {
      const needsSeparator = !effectivePrefix.endsWith(separator);
      return `${effectivePrefix}${needsSeparator ? separator : ''}${result}`;
    } else {
      return `--${result}`;
    }
  }

  // 경로 깊이 설정에 따라 처리
  let pathParts;
  if (propertyPathDepth >= 99) {
    // 전체 경로 사용
    pathParts = [...path];
  } else {
    // 마지막 N개의 경로 요소만 사용
    pathParts = path.slice(-propertyPathDepth);
  }

  // 기본 변환: 경로 요소들을 지정된 구분자로 연결
  let processed = pathParts.join(separator);

  // 대소문자 변환
  if (lowercase) {
    processed = processed.toLowerCase();
  }

  // 접두사 적용
  if (usePrefix && prefix !== '--') {
    const needsSeparator = !effectivePrefix.endsWith(separator);
    return `${effectivePrefix}${needsSeparator ? separator : ''}${processed}`;
  } else {
    return `--${processed}`;
  }
};

/**
 * 디자인 토큰을 CSS 변수로 변환합니다.
 */
export const generateCssFromTokens = (
  properties: TokenProperty[],
  options: {
    separator: string;
    lowercase: boolean;
    customFormat?: string[];
    useCodeSyntax?: boolean;
    decimals?: number;
    prefix?: string;
    usePrefix?: boolean;
    keySpaceSeparator?: string;
    propertyPathDepth?: number;
  }
): string => {
  let css = ':root {\n';
  const decimals = options.decimals ?? 4; // 기본값은 소수점 4자리

  properties.forEach(property => {
    const variableName = transformToCssVariableName(property, options);

    // codeSyntax 사용 여부에 따라 값 결정
    let value = property.value;
    if (options.useCodeSyntax && property.hasCodeSyntax && property.codeSyntaxValues) {
      // web 값이 있으면 우선 사용
      if (property.codeSyntaxValues.web) {
        value = property.codeSyntaxValues.web;
      } else {
        // 아니면 첫 번째 값 사용
        const firstValue = Object.values(property.codeSyntaxValues)[0];
        if (firstValue) value = firstValue;
      }
    }

    // 숫자 값인 경우 소수점 자리수 제한 적용
    const formattedValue = formatNumberValue(value, decimals);

    css += `  ${variableName}: ${formattedValue};\n`;
  });

  css += '}\n';
  return css;
};

/**
 * 디자인 토큰을 CSS 변수로 변환하지만 JSON 형식으로 출력합니다.
 */
export const generateJsonTokensAsCssVariables = (
  properties: TokenProperty[],
  options: {
    separator: string;
    lowercase: boolean;
    customFormat?: string[];
    useCodeSyntax?: boolean;
    outputFormat?: 'cssVars' | 'plainJson';
    decimals?: number;
    prefix?: string;
    usePrefix?: boolean;
    keySpaceSeparator?: string;
    propertyPathDepth?: number;
  }
): string => {
  const { separator, lowercase, customFormat, useCodeSyntax, outputFormat = 'cssVars' } = options;

  // CSS 변수 스타일로 토큰 생성
  if (outputFormat === 'cssVars') {
    let css = ':root {\n';
    const decimals = options.decimals ?? 4; // 기본값은 소수점 4자리

    properties.forEach(property => {
      // 변수 이름 생성
      const tokenName = transformTokenName(property.path, {
        separator, 
        lowercase, 
        customFormat,
        prefix: options.prefix
      });

      // 값 결정
      let tokenValue = property.value;

      // CodeSyntax 처리
      if (useCodeSyntax && property.hasCodeSyntax && property.codeSyntaxValues) {
        // web 값이 있으면 우선 사용
        if (property.codeSyntaxValues.web) {
          tokenValue = property.codeSyntaxValues.web;
        } else {
          // 아니면 첫 번째 값 사용
          const firstValue = Object.values(property.codeSyntaxValues)[0];
          if (firstValue) tokenValue = firstValue;
        }
      }

      // 숫자 값인 경우 소수점 자리수 제한 적용
      const formattedValue = formatNumberValue(tokenValue, decimals);

      css += `  ${tokenName}: ${formattedValue};\n`;
    });

    css += '}\n';
    return css;
  }

  // 일반 JSON 형식으로 토큰 생성
  const tokens: Record<string, any> = {};

  properties.forEach(property => {
    // 중첩 객체 구조 생성을 위한 함수
    const setNestedValue = (obj: any, pathParts: string[], value: any) => {
      const key = pathParts[0];
      if (pathParts.length === 1) {
        obj[key] = value;
      } else {
        obj[key] = obj[key] || {};
        setNestedValue(obj[key], pathParts.slice(1), value);
      }
    };

    // 경로 처리
    let pathParts = [...property.path];
    if (lowercase) {
      pathParts = pathParts.map(part => part.toLowerCase());
    }

    // 값 결정
    let tokenValue = property.value;
    if (useCodeSyntax && property.hasCodeSyntax && property.codeSyntaxValues) {
      if (property.codeSyntaxValues.web) {
        tokenValue = property.codeSyntaxValues.web;
      } else {
        const firstValue = Object.values(property.codeSyntaxValues)[0];
        if (firstValue) tokenValue = firstValue;
      }
    }

    // 숫자 값인 경우 소수점 자리수 제한 적용
    const decimals = options.decimals ?? 4; // 기본값은 소수점 4자리
    const formattedValue = formatNumberValue(tokenValue, decimals);

    setNestedValue(tokens, pathParts, formattedValue);
  });

  return JSON.stringify(tokens, null, 2);
};

/**
 * 객체의 모든 키를 변환합니다(중첩 객체 포함).
 * 디자인 토큰의 프로퍼티 이름을 CSS 친화적인 형태로 변환하는 데 유용합니다.
 * @param obj 변환할 객체
 * @param options 변환 옵션
 * @returns 변환된 키를 가진 새 객체
 */
export const transformObjectKeys = (obj: any, options: {
  separator?: string;
  lowercase?: boolean;
}): any => {
  if (!obj || typeof obj !== 'object') return obj;

  const separator = options.separator || '-';
  const lowercase = options.lowercase !== undefined ? options.lowercase : true;

  // 배열인 경우 각 항목 처리
  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectKeys(item, options));
  }

  // 객체인 경우 각 키 변환
  const result: Record<string, any> = {};

  for (const key in obj) {
    // $ 접두어가 있는 키는 변환하지 않음(디자인 토큰 시스템의 특수 속성)
    const newKey = key.charAt(0) === '$' ? key : transformKey(key, separator, lowercase);

    // 값이 객체면 재귀적으로 변환
    result[newKey] = typeof obj[key] === 'object' && obj[key] !== null
      ? transformObjectKeys(obj[key], options)
      : obj[key];
  }

  return result;
};

/**
 * 지정된 파일 확장자로 변환된 결과를 내려받을 수 있는 링크를 생성합니다.
 */
export const createDownloadLink = (content: string, filename: string, type: string): void => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 토큰 값에서 참조된 다른 토큰 값을 추출합니다.
 * 예: {Color.Gray.100} → Color.Gray.100
 * @param value 토큰 값
 * @returns 참조된 토큰 경로 또는 null (참조가 없는 경우)
 */
export const extractTokenReference = (value: string | any): string | null => {
  // 문자열이 아닌 경우 null 반환
  if (typeof value !== 'string') {
    return null;
  }

  // 중괄호 안의 내용을 추출하는 정규 표현식
  const referenceMatch = value.match(/\{([^}]+)\}/);
  if (referenceMatch && referenceMatch[1]) {
    return referenceMatch[1];
  }
  return null;
};

/**
 * 토큰 참조를 CSS 변수 참조로 변환합니다.
 * @param reference 토큰 참조 (예: Color.Gray.100)
 * @param options 변환 옵션
 * @returns CSS 변수 참조 (예: var(--color-gray-100))
 */
export const transformTokenReference = (reference: string, options: {
  separator: string;
  pathSeparator: string;
  spaceSeparator: string;
  lowercase: boolean;
  sourcePrefix?: string;
  useSourcePrefix?: boolean;
}): string => {
  const { separator, pathSeparator, spaceSeparator, lowercase, sourcePrefix = '--', useSourcePrefix } = options;

  // 경로 분리 (Color.Gray.100 → ['Color', 'Gray', '100'])
  const pathParts = reference.split('.');

  // 각 부분에 공백 처리와 대소문자 변환 적용
  const transformedParts = pathParts.map(part => {
    // 공백을 처리 (예: 'Letter Spacing' → 'letter_spacing')
    let transformed = part.replace(/\s+/g, spaceSeparator);
    // 소문자 변환 적용
    if (lowercase) {
      transformed = transformed.toLowerCase();
    }
    return transformed;
  });

  // 경로 요소들을 지정된 구분자로 결합
  const variablePath = transformedParts.join(pathSeparator);

  // 접두사 처리
  let prefix = '--';
  if (useSourcePrefix && sourcePrefix !== '--') {
    // 사용자 지정 접두사 추가
    prefix = sourcePrefix.startsWith('--') ? sourcePrefix : `--${sourcePrefix}`;
    // 접두사와 결과 사이에 구분자 추가 (접두사가 끝에 구분자가 없는 경우만)
    const needsSeparator = !prefix.endsWith(separator);
    prefix = `${prefix}${needsSeparator ? separator : ''}`;
  }

  // CSS var() 함수로 래핑
  return `var(${prefix}${variablePath})`;
};

/**
 * 디자인 토큰을 다른 토큰 형식으로 변환합니다.
 */
export const generateTokenToToken = (
  properties: TokenProperty[],
  options: {
    separator: string;
    pathSeparator: string;
    spaceSeparator: string;
    lowercase: boolean;
    useCodeSyntax?: boolean;
    decimals?: number;
    targetPrefix?: string;
    useTargetPrefix?: boolean;
    sourcePrefix?: string;
    useSourcePrefix?: boolean;
    propertyPathDepth?: number;
  }
): string => {
  let css = ':root {\n';
  const decimals = options.decimals ?? 4; // 기본값은 소수점 4자리

  properties.forEach(property => {
    // 변수 이름 생성 (타겟 변수)
    const tokenName = transformTokenName(property.path, {
      separator: options.pathSeparator, 
      lowercase: options.lowercase,
      prefix: options.targetPrefix,
      usePrefix: options.useTargetPrefix,
      propertyPathDepth: options.propertyPathDepth
    });

    // 값 처리
    let tokenValue = property.value;

    // 참조 토큰 확인 및 변환
    // 문자열 타입인지 확인
    if (typeof tokenValue === 'string') {
      const reference = extractTokenReference(tokenValue);
      if (reference) {
        // 참조를 CSS var() 함수로 변환
        tokenValue = transformTokenReference(reference, {
          separator: options.separator,
          pathSeparator: options.pathSeparator,
          spaceSeparator: options.spaceSeparator,
          lowercase: options.lowercase,
          sourcePrefix: options.sourcePrefix,
          useSourcePrefix: options.useSourcePrefix
        });
      }
    } else {
      // CodeSyntax 처리 (참조가 아닌 경우만)
      if (options.useCodeSyntax && property.hasCodeSyntax && property.codeSyntaxValues) {
        if (property.codeSyntaxValues.web) {
          tokenValue = property.codeSyntaxValues.web;
        } else {
          const firstValue = Object.values(property.codeSyntaxValues)[0];
          if (firstValue) tokenValue = firstValue;
        }
      }

      // 숫자 값인 경우 소수점 자리수 제한 적용
      tokenValue = formatNumberValue(tokenValue, decimals);
    }

    css += `  ${tokenName}: ${tokenValue};\n`;
  });

  css += '}\n';
  return css;
};

// 유효하지 않은 CSS 속성에 대한 매핑 적용
export const applyInvalidCssPropertyMappings = (
  cssProperties: Record<string, string>, 
  invalidProperties: Map<string, string[]>
): Record<string, string> => {
  const result: Record<string, string> = {...cssProperties};

  // 유효하지 않은 속성들을 처리
  invalidProperties.forEach((mappedProps, invalidProp) => {
    if (invalidProp in result && mappedProps.length > 0) {
      const value = result[invalidProp];

      // 매핑된 각 속성에 원래 값을 적용
      mappedProps.forEach(mappedProp => {
        result[mappedProp] = value;
      });

      // 원래 유효하지 않은 속성 제거 (선택 사항)
      delete result[invalidProp];
    }
  });

  return result;
};

/**
 * 사용자 정의 CSS 속성을 기반으로 CSS 텍스트를 변환합니다.
 * 예: padding-horizontal: 10px → padding-left: 10px; padding-right: 10px;
 * @param cssText 원본 CSS 텍스트
 * @param customProperties 사용자 정의 속성 목록
 * @returns 변환된 CSS 텍스트
 */
export const transformCustomCssProperties = (
  cssText: string,
  customProperties: Array<{name: string, mappedTo: string[], description?: string}>
): string => {
  let transformedCss = cssText;

  // 사용자 정의 속성이 없으면 원본 반환
  if (!customProperties || customProperties.length === 0) {
    return cssText;
  }

  // 각 사용자 정의 속성에 대해 처리
  customProperties.forEach(prop => {
    // 이 사용자 정의 속성에 대한 모든 인스턴스 찾기
    const regex = new RegExp(`${prop.name}\s*:\s*([^;\}]+)[;\}]`, 'g');
    let match;

    // 찾은 모든 인스턴스를 변환
    while ((match = regex.exec(cssText)) !== null) {
      const fullMatch = match[0];
      const valueWithoutSemicolon = match[1].trim();
      const value = valueWithoutSemicolon.endsWith(';') ? valueWithoutSemicolon : valueWithoutSemicolon + ';';
      const isLastInBlock = fullMatch.endsWith('}');

      // 매핑된 표준 CSS 속성들로 대체할 텍스트 생성
      let replacement = '';
      prop.mappedTo.forEach((mappedProp, index) => {
        // 마지막 속성이고 원본이 블록의 끝이면 닫는 괄호 추가
        const ending = (index === prop.mappedTo.length - 1 && isLastInBlock) ? '}' : ';';
        replacement += `${mappedProp}: ${value.replace(/;$/, '')}${ending}`;
      });

      // 원본 텍스트에서 찾은 부분을 대체
      transformedCss = transformedCss.replace(fullMatch, replacement);
    }
  });

  return transformedCss;
};

/**
 * CSS 텍스트에서 표준이 아닌 속성을 검출합니다.
 * @param css CSS 텍스트
 * @param keywords 표준 CSS 속성 키워드 배열
 * @param customProperties 사용자 정의 CSS 속성 배열 (선택적)
 * @returns 검출된 비표준 속성의 Set 객체
 */
export const detectCustomProperties = (css: string, keywords: string[], customProperties?: Array<{name: string, mappedTo: string[], description?: string}>): Set<string> => {
  // 정규식 생성 방식 변경
  const ruleRegex = new RegExp("([^{}]+)\\s*\\{\\s*([^{}]*)\\s*\\}", "g");
  const propertyRegex = new RegExp("([\\w-]+)\\s*:\\s*([^;]+);?", "g");

  const detected = new Set<string>();
  // 기존 사용자 정의 속성 목록 가져오기
  const existing = new Set(
    (customProperties || getCustomCssProperties()).map(p => p.name)
  );

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

  return detected;
};
