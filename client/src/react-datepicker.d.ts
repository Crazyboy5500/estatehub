declare module 'react-datepicker' {
  import type { ComponentType } from 'react';

  export interface DatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date | null) => void;
    minDate?: Date | null;
    maxDate?: Date | null;
    inline?: boolean;
    dateFormat?: string;
    className?: string;
    calendarClassName?: string;
    wrapperClassName?: string;
    placeholderText?: string;
    disabled?: boolean;
    showTimeSelect?: boolean;
  }

  const DatePicker: ComponentType<DatePickerProps>;
  export default DatePicker;
}

declare module 'react-datepicker/dist/react-datepicker.css';