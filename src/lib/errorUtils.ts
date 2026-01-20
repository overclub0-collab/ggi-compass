// Error message sanitization utilities
// Maps technical database/auth errors to user-friendly messages

/**
 * Sanitizes database error messages to prevent information leakage
 */
export const getErrorMessage = (error: any): string => {
  if (!error) return '작업을 완료할 수 없습니다.';
  
  const errorCode = error.code;
  const errorMessage = error.message?.toLowerCase() || '';
  
  // PostgreSQL error codes
  if (errorCode === '23505') return '중복된 데이터가 있습니다.';
  if (errorCode === '23503') return '관련 데이터가 존재하지 않습니다.';
  if (errorCode === '23502') return '필수 항목이 누락되었습니다.';
  if (errorCode === '22P02') return '입력 형식이 올바르지 않습니다.';
  if (errorCode === '42501' || errorMessage.includes('rls') || errorMessage.includes('policy')) {
    return '권한이 없습니다.';
  }
  
  // Auth-related errors
  if (errorMessage.includes('invalid login') || errorMessage.includes('invalid credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않습니다.';
  }
  if (errorMessage.includes('user already registered') || errorMessage.includes('already exists')) {
    return '이미 등록된 사용자입니다.';
  }
  if (errorMessage.includes('email')) {
    return '이메일 형식이 올바르지 않습니다.';
  }
  if (errorMessage.includes('password')) {
    return '비밀번호가 올바르지 않거나 너무 짧습니다.';
  }
  
  // Storage errors
  if (errorMessage.includes('storage') || errorMessage.includes('bucket')) {
    return '파일 업로드 중 오류가 발생했습니다.';
  }
  
  // Network/timeout errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.';
  }
  
  // Default generic message - never expose raw error
  return '작업을 완료할 수 없습니다.';
};

/**
 * Logs error only in development mode
 */
export const logError = (context: string, error: any): void => {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  }
  // In production, errors are silently swallowed or could be sent to error tracking service
};
