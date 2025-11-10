import MESSAGES from '@/config/messages';
import type { AxiosError } from 'axios';

type ErrorResponse = {
    success: boolean;
    error?:
        | string
        | {
              name?: string;
              message?: string;
          };
};

export const getErrorMessage = (error: AxiosError<ErrorResponse>, defaultMessage: string): string => {
    const errorResponse = error.response?.data;

    if (!errorResponse?.error) {
        return defaultMessage;
    }

    if (typeof errorResponse.error === 'string') {
        const messageValues = Object.values(MESSAGES);
        const matchedMessage = messageValues.find((msg) => errorResponse.error === msg);
        return matchedMessage || errorResponse.error;
    }

    if (typeof errorResponse.error === 'object' && errorResponse.error.message) {
        const errorObj = errorResponse.error;
        const errorMessage = errorObj.message as string;

        if (errorObj.name === 'ZodError') {
            try {
                const zodErrors = JSON.parse(errorMessage);
                if (Array.isArray(zodErrors) && zodErrors.length > 0) {
                    const zodMessage = zodErrors[0].message;

                    const messageValues = Object.values(MESSAGES);
                    const matchedMessage = messageValues.find((msg) => zodMessage === msg);
                    return matchedMessage || zodMessage;
                }
            } catch {
                return defaultMessage;
            }
        } else {
            const messageValues = Object.values(MESSAGES);
            const matchedMessage = messageValues.find((msg) => errorMessage === msg);
            return matchedMessage || errorMessage;
        }
    }

    return defaultMessage;
};
