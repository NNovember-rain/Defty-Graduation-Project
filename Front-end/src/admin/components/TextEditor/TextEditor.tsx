import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
import "./style.css"

interface AdvancedRichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const TextEditor: React.FC<AdvancedRichTextEditorProps> = ({ value, onChange, disabled, placeholder }) => {
    return (
        <Editor
            apiKey="wzzc5fhduwmmxr6wph6lzh7mh2rajmzbv6yp27bkrc1sea3r"
            value={value}
            onEditorChange={onChange}
            init={{
                plugins: [
                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons',
                    'link', 'lists', 'media', 'searchreplace', 'table',
                    'visualblocks', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | bold italic | bullist numlist | link table | code',
                tinycomments_mode: 'embedded',
                tinycomments_author: 'Author name',
                mergetags_list: [
                    { value: 'First.Name', title: 'First Name' },
                    { value: 'Email', title: 'Email' },
                ],
                ai_request: (request, respondWith) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
                uploadcare_public_key: '3ab22f661d0803780786',
                readonly: disabled,
                placeholder: placeholder,
                height: 500,
                elementpath: false,
            }}
        />
    );
};

export default TextEditor;
