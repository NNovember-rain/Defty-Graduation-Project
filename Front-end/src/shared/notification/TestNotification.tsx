// 6. components/UserProfile.tsx - Ví dụ sử dụng
import React, { useState } from 'react';
import { Button, Space, Form, Input } from 'antd';
import type { FormProps } from 'antd';
import { useNotification } from './useNotification';

interface UserFormData {
    name: string;
    email: string;
}

const TestNotification: React.FC = () => {
    const { message, notification, modal } = useNotification();
    const [loading, setLoading] = useState<boolean>(false);
    const [form] = Form.useForm<UserFormData>();

    const handleSave: FormProps<UserFormData>['onFinish'] = async () => {
        const hide = message.loading('Đang lưu thông tin...');
        setLoading(true);

        try {
            // Giả lập API call
            await new Promise<void>(resolve => setTimeout(resolve, 2000));

            hide();
            message.success('Lưu thông tin thành công!');

            // Reset form nếu cần
            // form.resetFields();
        } catch (error) {
            hide();
            message.error('Lưu thông tin thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (): void => {
        modal.deleteConfirm(
            'Xóa tài khoản',
            async () => {
                try {
                    // Giả lập API call
                    await new Promise<void>(resolve => setTimeout(resolve, 1000));
                    message.success('Đã xóa tài khoản thành công!');
                } catch (error) {
                    message.error('Xóa tài khoản thất bại!');
                }
            },
            'Bạn có chắc chắn muốn xóa tài khoản này không?'
        );
    };

    const showNotificationExample = (): void => {
        notification.success(
            'Cập nhật thành công',
            'Thông tin của bạn đã được cập nhật thành công!',
            { duration: 5, placement: 'topRight' }
        );
    };

    const handleFormError = (errorInfo: any): void => {
        console.error('Form validation failed:', errorInfo);
        message.error('Vui lòng kiểm tra lại thông tin!');
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>User Profile</h2>

            <Form<UserFormData>
                form={form}
                onFinish={handleSave}
                onFinishFailed={handleFormError}
                layout="vertical"
                initialValues={{ name: '', email: '' }}
            >
                <Form.Item
                    label="Tên"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                    <Input placeholder="Nhập tên của bạn" />
                </Form.Item>

                <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                        { required: true, message: 'Vui lòng nhập email!' },
                        { type: 'email', message: 'Email không hợp lệ!' }
                    ]}
                >
                    <Input placeholder="Nhập email của bạn" />
                </Form.Item>

                <Space>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Lưu thông tin
                    </Button>
                    <Button onClick={showNotificationExample}>
                        Show Notification
                    </Button>
                    <Button danger onClick={handleDelete}>
                        Xóa tài khoản
                    </Button>
                </Space>
            </Form>
        </div>
    );
};

export default TestNotification;