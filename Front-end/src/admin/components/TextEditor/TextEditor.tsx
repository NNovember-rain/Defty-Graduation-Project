import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface AdvancedRichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const TextEditor: React.FC<AdvancedRichTextEditorProps> = ({ value, onChange, disabled, placeholder }) => {
    return (
        <Editor
            apiKey="5b0xyzqgac6a8zuzo0h1u9dj8e8uz6shthlqr6me5ialne6i"
            value={value}
            onEditorChange={onChange}
            init={{
                plugins: [
                    'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                    'checklist', 'mediaembed', 'casechange', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen',
                    'powerpaste', 'advtable', 'advcode', 'advtemplate', 'ai', 'uploadcare', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes',
                    'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
                ],
                toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography uploadcare | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
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
            }}
        />
    );
};

export default TextEditor;
