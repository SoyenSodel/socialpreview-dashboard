import { useState, useCallback, type ChangeEvent } from 'react';

export const useForm = <T extends object>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>(
    {} as Record<keyof T, boolean>
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleBlur = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setTouched({} as Record<keyof T, boolean>);
  }, [initialValues]);

  const setValue = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  return {
    values,
    touched,
    handleChange,
    handleBlur,
    reset,
    setValue,
  };
};
