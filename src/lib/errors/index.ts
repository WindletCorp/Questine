import { toast } from 'sonner';

export type AppErrorType = 'NETWORK' | 'AUTH' | 'CONFIG' | 'UNKNOWN';

export interface AppError {
  type: AppErrorType;
  message: string;
  ctaText?: string;
  ctaAction?: () => void;
}

/**
 * Handles errors on the client side by displaying a toast notification with a standardized CTA.
 * Satisfies sustainable code rules for proper error messages and CTAs.
 */
export const handleClientError = (error: AppError | Error | unknown) => {
  let message = 'An unexpected error occurred.';
  let ctaText = 'Retry';
  let ctaAction = () => window.location.reload();

  if (typeof error === 'object' && error !== null && 'type' in error) {
    const appErr = error as AppError;
    message = appErr.message;
    if (appErr.ctaText) ctaText = appErr.ctaText;
    if (appErr.ctaAction) ctaAction = appErr.ctaAction;
  } else if (error instanceof Error) {
    message = error.message;
  }

  // Display toast with CTA
  toast.error(message, {
    action: {
      label: ctaText,
      onClick: ctaAction,
    },
    duration: 6000,
  });
};

/**
 * Factory to create structured app errors.
 */
export const createError = (
  type: AppErrorType,
  message: string,
  ctaText?: string,
  ctaAction?: () => void
): AppError => {
  return { type, message, ctaText, ctaAction };
};
