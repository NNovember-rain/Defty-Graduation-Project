import type { DatePickerProps } from 'antd/es/date-picker';
import dayjsGenerateConfig from 'rc-picker/lib/generate/dayjs';
import generatePicker from 'antd/es/date-picker/generatePicker';
import type { Dayjs } from "dayjs";

// Tạo DatePicker được tùy chỉnh để sử dụng Day.js
const AntdDatePicker = generatePicker<Dayjs>(dayjsGenerateConfig);

// Export các type cần thiết
export type CustomDatePickerProps = DatePickerProps<Dayjs>;

// Export DatePicker đã cấu hình để dùng trong toàn ứng dụng
export default AntdDatePicker;