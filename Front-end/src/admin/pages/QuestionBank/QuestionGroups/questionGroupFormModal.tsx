import React, {useEffect, useRef, useState} from "react";
import {CheckCircle, Clipboard, ImageIcon, Plus, Trash2, Upload, X} from "lucide-react";
import {
    type AnswerResponse,
    DifficultyLevel,
    type FileResponse,
    getDifficultyText,
    getToeicPartText,
    type QuestionGroupBulkRequest,
    type QuestionGroupResponse,
    type QuestionResponse,
    ToeicPart
} from "../../../../shared/services/questionBankService/questionGroupService";
import {useNotification} from "../../../../shared/notification/useNotification.ts";
import type {IQuestionTag} from "../../../../shared/services/questionBankService/questionTagService";
import {Select} from "antd";
import TextEditor from "../../../components/TextEditor/TextEditor";

if (!(crypto as any).randomUUID) {
    (crypto as any).randomUUID = function(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c: string) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
}

export type FormMode = "create" | "edit";

interface QuestionGroupFormModalProps {
    isOpen: boolean;
    mode: FormMode;
    initialData?: QuestionGroupResponse;
    allQuestionTags?: IQuestionTag[];
    onClose: () => void;
    onSave: (data: QuestionGroupBulkRequest, files?: File[]) => Promise<void>;
}

const PART_TEMPLATES = {
    [ToeicPart.PART_1]: { questions: 1, answersPerQuestion: 4, allowAddQuestion: false },
    [ToeicPart.PART_2]: { questions: 1, answersPerQuestion: 3, allowAddQuestion: false },
    [ToeicPart.PART_3]: { questions: 3, answersPerQuestion: 4, allowAddQuestion: false },
    [ToeicPart.PART_4]: { questions: 3, answersPerQuestion: 4, allowAddQuestion: false },
    [ToeicPart.PART_5]: { questions: 1, answersPerQuestion: 4, allowAddQuestion: false },
    [ToeicPart.PART_6]: { questions: 4, answersPerQuestion: 4, allowAddQuestion: false },
    [ToeicPart.PART_7]: {
        questions: 2,
        answersPerQuestion: 4,
        allowAddQuestion: true,
        minQuestions: 2,
        maxQuestions: 5
    },
    [ToeicPart.CUSTOM]: {
        questions: 1,
        answersPerQuestion: 1,
        allowAddQuestion: true,
        minQuestions: 0,
        maxQuestions: Infinity
    }
};

// Helper function để lấy unique key của item
const getItemKey = (item: any): string => {
    return item.tempKey || item.id || '';
};

const getMaxImagesForPart = (part: ToeicPart) => {
    return part === ToeicPart.CUSTOM ? Infinity : 5;
};

const QuestionGroupFormModal: React.FC<QuestionGroupFormModalProps> = ({
                                                                           isOpen,
                                                                           mode,
                                                                           allQuestionTags,
                                                                           initialData,
                                                                           onClose,
                                                                           onSave,
                                                                       }) => {
    const { message, modal } = useNotification();
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState<Partial<QuestionGroupResponse>>({
        questionPart: ToeicPart.PART_1,
        difficulty: null,
        questionPartOrder: 1,
        requiredImage: 0,
        requiredAudio: false,
        status: 1,
        questions: [],
        files: [],
    });

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sau PART_TEMPLATES constant
    const initializeQuestionsForPart = (part: ToeicPart, currentDifficulty?: DifficultyLevel | null): QuestionResponse[] => {
        const template = PART_TEMPLATES[part];
        const questions: QuestionResponse[] = [];

        for (let i = 0; i < template.questions; i++) {
            const answers: AnswerResponse[] = [];
            for (let j = 0; j < template.answersPerQuestion; j++) {
                answers.push({
                    id: undefined,
                    tempKey: crypto.randomUUID(),
                    content: "",
                    answerOrder: j + 1,
                    isCorrect: j === 0, // Đáp án đầu tiên mặc định đúng
                    questionId: "",
                    status: 1,
                } as AnswerResponse);
            }

            questions.push({
                id: undefined,
                tempKey: crypto.randomUUID(),
                questionNumber: i + 1,
                questionText: "",
                difficulty: currentDifficulty || DifficultyLevel.EASY,
                questionGroupId: "",
                status: 1,
                answers,
                tags: []
            } as QuestionResponse);
        }

        return questions;
    };

    const handleClose = () => {
        modal.confirm({
            title: "Xác nhận đóng",
            content: "Bạn có chắc chắn muốn đóng? Các thay đổi chưa lưu sẽ bị mất.",
            okText: "Đóng",
            cancelText: "Ở lại",
            okType: "danger",
            onOk: () => {
                // Pause audio if playing
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                if (audioElement) {
                    audioElement.pause();
                    setAudioElement(null);
                }

                onClose();
            }
        });
    };

    const handleChange = (field: keyof QuestionGroupResponse, value: any) => {
        if (field === "questionPart") {
            const nextPart = value as ToeicPart;

            const requiresAudio =
                [ToeicPart.PART_1, ToeicPart.PART_2, ToeicPart.PART_3, ToeicPart.PART_4].includes(nextPart)
                    ? true
                    : nextPart === ToeicPart.CUSTOM
                        ? false
                        : false;
            const requiresImage = nextPart === ToeicPart.PART_1 ? 1 : 0;

            const hasData =
                (formData.questions?.some(q =>
                    q.questionText?.trim() ||
                    q.answers?.some(a => a.content?.trim())
                ) ?? false)
                || !!formData.audioTranscript?.trim()
                || !!formData.explanation?.trim()
                || !!formData.notes?.trim()
                || !!formData.passageText?.trim()
                || (formData.files?.length ?? 0) > 0;

            const doReset = () => {
                setFormData({
                    questionPart: nextPart,
                    questionPartOrder: 1,
                    difficulty: null,
                    requiredImage: requiresImage,
                    requiredAudio: requiresAudio,
                    status: 1,
                    questions: initializeQuestionsForPart(nextPart),
                    files: [],
                    audioTranscript: "",
                    explanation: "",
                    passageText: "",
                    notes: "",
                });
                setUploadedFiles([]);
                setAudioElement(null);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            };

            if (hasData) {
                modal.confirm({
                    title: "Đổi Part",
                    content: "Thay đổi Part sẽ xóa toàn bộ dữ liệu hiện tại (câu hỏi, file, transcript...). Bạn có chắc muốn tiếp tục?",
                    okText: "Đồng ý",
                    cancelText: "Hủy",
                    okType: "danger",
                    onOk: doReset,
                });
            } else {
                doReset();
            }
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }
    };
    useEffect(() => {
        if (!isOpen) {
            // Reset khi đóng modal
            setPreviewImage(null);
            return;
        }

        // Init khi mở modal
        if (mode === "edit" && initialData) {
            const requiresAudio = [ToeicPart.PART_1, ToeicPart.PART_2, ToeicPart.PART_3, ToeicPart.PART_4]
                .includes(initialData.questionPart);

            const questionsWithKeys = (initialData.questions || []).map(q => ({
                ...q,
                tag: q.tags,
                tempKey: q.tempKey || crypto.randomUUID(),
                answers: (q.answers || []).map(a => ({
                    ...a,
                    tempKey: a.tempKey || crypto.randomUUID(),
                }))
            }));

            const filesWithKeys = (initialData.files || []).map(f => ({
                ...f,
                tempKey: f.tempKey || crypto.randomUUID(),
            }));

            setFormData({
                ...initialData,
                requiredAudio: requiresAudio,
                questions: questionsWithKeys,
                files: filesWithKeys,
            });
        } else {
            // CREATE MODE - Mặc định CUSTOM
            setFormData({
                questionPart: ToeicPart.CUSTOM,
                difficulty: null,
                questionPartOrder: 1,
                requiredImage: 0,
                requiredAudio: false,
                status: 1,
                questions: initializeQuestionsForPart(ToeicPart.CUSTOM),
                files: [],
            });
        }
        setUploadedFiles([]);
    }, [isOpen, mode, initialData]);

    useEffect(() => {
        return () => {
            if (audioElement) {
                audioElement.pause();
                setAudioElement(null);
            }
        };
    }, [audioElement]);

    useEffect(() => {
        if (!isOpen) return;

        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            let currentImages = (formData.files || []).filter(f => f.type === "IMAGE");

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") !== -1) {
                    const maxImages = getMaxImagesForPart(formData.questionPart!);
                    if (currentImages.length >= maxImages) {
                        message.error(`Chỉ được phép tối đa ${maxImages} hình ảnh`);
                        break;
                    }
                    const file = items[i].getAsFile();
                    if (file) {
                        handleFileUpload(file, "IMAGE");
                        currentImages.push({ tempKey: crypto.randomUUID(), type: "IMAGE" } as any);
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener("paste", handlePaste);
        return () => document.removeEventListener("paste", handlePaste);
    }, [isOpen, formData.files, formData.requiredImage]);

    if (!isOpen) return null;

    const handleFileUpload = (file: File, type: "AUDIO" | "IMAGE") => {
        // === 1️⃣ Validate định dạng & dung lượng ===
        const MAX_SIZE_MB = type === "AUDIO" ? 10 : 5;
        const MAX_SIZE = MAX_SIZE_MB * 1024 * 1024;

        const validAudioTypes = [
            "audio/mpeg",
            "audio/wav",
            "audio/x-wav",
            "audio/mp3",
            "audio/ogg",
            "audio/m4a",
        ];
        const validImageTypes = ["image/jpeg", "image/png", "image/webp"];

        if (type === "AUDIO" && !validAudioTypes.includes(file.type)) {
            message.error("Vui lòng chọn file âm thanh hợp lệ (.mp3, .wav, .m4a, .ogg)");
            return;
        }

        if (type === "IMAGE" && !validImageTypes.includes(file.type)) {
            message.error("Vui lòng chọn file hình ảnh hợp lệ (.jpg, .png, .webp)");
            return;
        }

        if (file.size > MAX_SIZE) {
            message.error(`File ${type === "AUDIO" ? "âm thanh" : "hình ảnh"} vượt quá ${MAX_SIZE_MB}MB`);
            return;
        }

        // === 2️⃣ Giới hạn số lượng ảnh ===
        if (type === "IMAGE") {
            const currentImages = (formData.files || []).filter(f => f.type === "IMAGE");
            const maxImages = getMaxImagesForPart(formData.questionPart!);
            if (currentImages.length >= maxImages) {
                message.error(`Chỉ được phép tối đa ${maxImages} hình ảnh`);
                return;
            }
        }

        // === 3️⃣ Chuẩn bị file mới ===
        const newFile: FileResponse = {
            id: undefined,
            tempKey: crypto.randomUUID(),
            type: type as any,
            url: URL.createObjectURL(file),
            questionGroupId: formData.id || "",
            displayOrder: (formData.files?.length || 0) + 1,
            status: 1,
            name: file.name || "",
        };

        // === 4️⃣ Nếu là AUDIO: reset toàn bộ audio state & dừng phát ===
        if (type === "AUDIO") {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setDuration(0);

            // Cập nhật lại danh sách file (chỉ giữ 1 audio)
            setFormData(prev => ({
                ...prev,
                files: [
                    ...(prev.files || []).filter(f => f.type !== "AUDIO"),
                    newFile,
                ],
            }));

            // Ghi lại danh sách upload
            setUploadedFiles(prev => [
                ...prev.filter(f => f.type !== "AUDIO"),
                file,
            ]);
            return;
        }

        // === 5️⃣ Nếu là IMAGE ===
        setUploadedFiles(prev => [...prev, file]);
        setFormData(prev => ({
            ...prev,
            files: [...(prev.files || []), newFile],
        }));
    };

    // ✅ CẢI TIẾN
    const handleRemoveFile = (fileKey: string) => {
        const fileToRemove = (formData.files || []).find(f => getItemKey(f) === fileKey);

        // Remove from formData.files
        const updatedFiles = (formData.files || []).filter(f => getItemKey(f) !== fileKey);
        handleChange("files", updatedFiles);

        // Remove from uploadedFiles if it's a CREATE file (id === undefined)
        if (fileToRemove && !fileToRemove.id) {
            // Count CREATE files before this one
            const createFilesBefore = (formData.files || [])
                .slice(0, formData.files?.indexOf(fileToRemove))
                .filter(f => !f.id).length;

            const newUploadedFiles = [...uploadedFiles];
            newUploadedFiles.splice(createFilesBefore, 1);
            setUploadedFiles(newUploadedFiles);
        }
    };

    // Question management functions
    const addQuestion = () => {
        if (![ToeicPart.PART_7, ToeicPart.CUSTOM].includes(formData.questionPart!)) {
            message.warning("Chỉ Part 7 hoặc Custom mới có thể thêm câu hỏi!");
            return;
        }

        const template = PART_TEMPLATES[ToeicPart.PART_7];
        const current = formData.questions?.length || 0;
        const max = template.maxQuestions || 5;

        if (formData.questionPart === ToeicPart.PART_7 && current >= max) {
            message.warning(`Part 7 chỉ cho phép tối đa ${max} câu hỏi.`);
            return;
        }

        // Tạo sẵn 4 đáp án trống
        const answers: AnswerResponse[] = Array.from({ length: 4 }, (_, i) => ({
            id: undefined,
            tempKey: crypto.randomUUID(),
            content: "",
            answerOrder: i + 1,
            isCorrect: i === 0,
            questionId: "",
            status: 1,
        }));

        const newQuestion: QuestionResponse = {
            id: undefined,
            tempKey: crypto.randomUUID(),
            questionNumber: current + 1,
            questionText: "",
            difficulty: formData.difficulty || null,
            questionGroupId: formData.id || "",
            status: 1,
            answers,
            tags: [],
        };

        const updatedQuestions = [...(formData.questions || []), newQuestion];
        handleChange("questions", updatedQuestions);
    };

    const removeQuestion = (questionKey: string) => {
        const current = formData.questions?.length || 0;
        const min = PART_TEMPLATES[ToeicPart.PART_7].minQuestions || 2;

        if (formData.questionPart === ToeicPart.PART_7 && current <= min) {
            message.warning(`Part 7 phải có ít nhất ${min} câu hỏi.`);
            return;
        }

        const updatedQuestions = (formData.questions || []).filter(
            q => getItemKey(q) !== questionKey
        );

        const reordered = updatedQuestions.map((q, i) => ({
            ...q,
            questionNumber: i + 1,
        }));

        handleChange("questions", reordered);
    };

    const updateQuestion = (questionKey: string, field: keyof QuestionResponse, value: any) => {
        const updatedQuestions = (formData.questions || []).map(q =>
            getItemKey(q) === questionKey ? { ...q, [field]: value } : q
        );
        handleChange("questions", updatedQuestions);
    };

    const updateQuestionTags = (questionKey: string, selectedTagIds: string[]) => {
        const selectedTags = (allQuestionTags || []).filter(tag => selectedTagIds.includes(tag.id));
        updateQuestion(questionKey, "tags", selectedTags);
    };

    // Answer management functions
    const addAnswer = (questionKey: string) => {
        const question = formData.questions?.find(q => getItemKey(q) === questionKey);
        if (!question) return;

        const newAnswer: Partial<AnswerResponse> = {
            id: undefined,
            tempKey: crypto.randomUUID(),
            content: "",
            answerOrder: (question.answers?.length || 0) + 1,
            isCorrect: false,
            questionId: question.id || "",
            status: 1,
        };

        const updatedAnswers = [...(question.answers || []), newAnswer as AnswerResponse];
        updateQuestion(questionKey, "answers", updatedAnswers);
    };

    const removeAnswer = (questionKey: string, answerKey: string) => {
        const question = formData.questions?.find(q => getItemKey(q) === questionKey);
        if (!question) return;

        const updatedAnswers = (question.answers || []).filter(a => getItemKey(a) !== answerKey);
        const reorderedAnswers = updatedAnswers.map((a, index) => ({
            ...a,
            answerOrder: index + 1,
        }));
        updateQuestion(questionKey, "answers", reorderedAnswers);
    };

    const updateAnswer = (questionKey: string, answerKey: string, field: keyof AnswerResponse, value: any) => {
        const question = formData.questions?.find(q => getItemKey(q) === questionKey);
        if (!question) return;

        const updatedAnswers = (question.answers || []).map(a =>
            getItemKey(a) === answerKey ? { ...a, [field]: value } : a
        );
        updateQuestion(questionKey, "answers", updatedAnswers);
    };

    const setCorrectAnswer = (questionKey: string, answerKey: string) => {
        const question = formData.questions?.find(q => getItemKey(q) === questionKey);
        if (!question) return;

        const updatedAnswers = (question.answers || []).map(a => ({
            ...a,
            isCorrect: getItemKey(a) === answerKey,
        }));
        updateQuestion(questionKey, "answers", updatedAnswers);
    };

    const moveImage = (from: number, to: number) => {
        setFormData(prev => {
            if (!prev.files) return prev;
            const images = [...prev.files.filter(f => f.type === "IMAGE")];
            const others = prev.files.filter(f => f.type !== "IMAGE");

            const [moved] = images.splice(from, 1);
            images.splice(to, 0, moved);

            return { ...prev, files: [...others, ...images] };
        });

        setUploadedFiles(prev => {
            const images = [...prev];
            const [moved] = images.splice(from, 1);
            images.splice(to, 0, moved);
            return images;
        });
    };

    const handleSave = async () => {
        const part = formData.questionPart;

        if (!part) return message.error("Vui lòng chọn Part!");
        if (!formData.questions?.length) return message.error("Vui lòng thêm ít nhất một câu hỏi!");

        // === 1️⃣ Validate audio/image bắt buộc ===
        const requiresAudio = [ToeicPart.PART_1, ToeicPart.PART_2, ToeicPart.PART_3, ToeicPart.PART_4].includes(part);
        const requiresImage = part === ToeicPart.PART_1;

        const audioFiles = formData.files?.filter(f => f.type === "AUDIO") || [];
        const imageFiles = formData.files?.filter(f => f.type === "IMAGE") || [];

        if (requiresAudio && audioFiles.length === 0) {
            return message.error(`Part ${part} bắt buộc phải có file audio!`);
        }
        if (requiresImage && imageFiles.length === 0) {
            return message.error("Part 1 bắt buộc phải có ít nhất 1 hình ảnh!");
        }

        // === 2️⃣ Validate chi tiết từng câu ===
        for (const question of formData.questions) {
            const answers = question.answers || [];
            const correctAnswers = answers.filter(a => a.isCorrect);
            const qText = question.questionText?.trim() || "";

            // --- Validate độ dài ---
            if (qText.length > 500) {
                return message.error(`Câu hỏi ${question.questionNumber} vượt quá 500 ký tự!`);
            }

            for (const ans of answers) {
                const aText = ans.content?.trim() || "";
                if (aText.length > 300) {
                    return message.error(
                        `Đáp án ${String.fromCharCode(64 + ans.answerOrder)} của câu ${question.questionNumber} vượt quá 300 ký tự!`
                    );
                }
            }

            // --- Validate logic chung ---
            if (!answers.length)
                return message.error(`Câu hỏi ${question.questionNumber} chưa có đáp án nào!`);
            if (correctAnswers.length !== 1)
                return message.error(`Câu hỏi ${question.questionNumber} phải có đúng 1 đáp án đúng!`);

            // --- Logic từng Part ---
            switch (part) {
                // 🖼️ PART 1: Mô tả tranh (4 đáp án, không cần text)
                case ToeicPart.PART_1:
                    if (answers.length !== 4)
                        return message.error(`Câu hỏi ${question.questionNumber} (Part 1) phải có đúng 4 đáp án!`);
                    break;

                // 🎧 PART 2: Hỏi – đáp (3 đáp án, không cần text)
                case ToeicPart.PART_2:
                    if (answers.length !== 3)
                        return message.error(`Câu hỏi ${question.questionNumber} (Part 2) phải có đúng 3 đáp án!`);
                    break;

                // 💬 PART 3–4: Hội thoại / Bài nói
                case ToeicPart.PART_3:
                case ToeicPart.PART_4:
                    if (answers.length !== 4)
                        return message.error(`Câu hỏi ${question.questionNumber} (${getToeicPartText(part)}) phải có đúng 4 đáp án!`);
                    if (!qText)
                        return message.error(`Câu hỏi ${question.questionNumber} (${getToeicPartText(part)}) không được để trống nội dung!`);
                    if (answers.some(a => !a.content?.trim()))
                        return message.error(`Các đáp án của câu hỏi ${question.questionNumber} không được để trống!`);
                    break;

                // ✍️ PART 5: Điền từ ngắn
                case ToeicPart.PART_5:
                    if (answers.length !== 4)
                        return message.error(`Câu hỏi ${question.questionNumber} (Part 5) phải có đúng 4 đáp án!`);
                    if (!qText)
                        return message.error(`Câu hỏi ${question.questionNumber} không được để trống nội dung!`);
                    if (answers.some(a => !a.content?.trim()))
                        return message.error(`Các đáp án của câu hỏi ${question.questionNumber} không được để trống!`);
                    break;

                // 📘 PART 6: Điền đoạn văn
                case ToeicPart.PART_6:
                    if (answers.length !== 4)
                        return message.error(`Câu hỏi ${question.questionNumber} (Part 6) phải có đúng 4 đáp án!`);
                    if (!qText)
                        return message.error(`Câu hỏi ${question.questionNumber} không được để trống nội dung!`);
                    if (answers.some(a => !a.content?.trim()))
                        return message.error(`Các đáp án của câu hỏi ${question.questionNumber} không được để trống!`);
                    break;

                // 📖 PART 7: Đọc hiểu
                case ToeicPart.PART_7:
                    if (answers.length !== 4)
                        return message.error(`Câu hỏi ${question.questionNumber} (Part 7) phải có đúng 4 đáp án!`);
                    if (!qText)
                        return message.error(`Câu hỏi ${question.questionNumber} không được để trống nội dung!`);
                    if (answers.some(a => !a.content?.trim()))
                        return message.error(`Các đáp án của câu hỏi ${question.questionNumber} không được để trống!`);
                    break;
            }
        }

        // === 3️⃣ Lưu dữ liệu ===
        try {
            setIsSaving(true);

            const dataToSave = {
                id: formData.id || null,
                questionGroup: {
                    id: formData.id || null,
                    questionPart: formData.questionPart!,
                    questionPartOrder: formData.questionPartOrder,
                    audioTranscript: formData.audioTranscript,
                    explanation: formData.explanation,
                    passageText: formData.passageText,
                    difficulty: formData.difficulty!,
                    notes: formData.notes,
                    requiredImage: formData.requiredImage,
                    requiredAudio: formData.requiredAudio,
                },
                questions: formData.questions?.map(q => ({
                    id: q.id || null,
                    questionNumber: q.questionNumber,
                    questionText: q.questionText,
                    difficulty: q.difficulty,
                    answers: q.answers?.map(a => ({
                        id: a.id || null,
                        content: a.content,
                        answerOrder: a.answerOrder,
                        isCorrect: a.isCorrect,
                    })) || [],
                    tagIds: q.tags?.map(tag => tag.id) || []
                })) || [],
                files: formData.files?.map(f => ({
                    id: f.id || null,
                    type: f.type,
                    displayOrder: f.displayOrder,
                })) || [],
            };

            await onSave(dataToSave as QuestionGroupBulkRequest, uploadedFiles);
            setIsSaving(false);
        } catch (err) {
            console.error(err);
            message.error("Có lỗi xảy ra khi lưu dữ liệu!");
            setIsSaving(false);
        }
    };

    const imageFiles = formData.files?.filter(f => f.type === "IMAGE") || [];

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
                    <h2 className="text-lg font-semibold text-secondary-800">
                        {mode === "create" ? "Thêm Nhóm Câu Hỏi" : "Chỉnh Sửa Nhóm Câu Hỏi"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-secondary-500 hover:text-secondary-700 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-12 gap-4">
                        <input type="hidden" value={ToeicPart.CUSTOM} />
                    </div>

                    {/* Main Content Layout: Images Left, Questions Right */}
                    <div className="grid grid-cols-12 gap-6 items-stretch">
                        {/* Image Section */}
                        {((formData.requiredImage ?? 0) > 0 || [ToeicPart.CUSTOM, ToeicPart.PART_1, ToeicPart.PART_3, ToeicPart.PART_4, ToeicPart.PART_6, ToeicPart.PART_7].includes(formData?.questionPart!)) && (
                            <div className="col-span-5 h-full">
                                <div className="bg-green-50 p-4 rounded-md border border-green-200 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-green-700">
                                            <ImageIcon className="inline w-4 h-4 mr-1" />
                                            Hình ảnh
                                        </label>
                                        <div className="flex space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={imageFiles.length >= getMaxImagesForPart(formData.questionPart!)}  // ✅ Thêm dòng này
                                                className={`flex items-center px-2 py-1 rounded text-xs transition-colors ${
                                                    imageFiles.length >= getMaxImagesForPart(formData.questionPart!)
                                                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                                                        : 'bg-green-600 text-white hover:bg-green-700'
                                                }`}
                                            >
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-xs text-green-600 mb-3 flex items-center">
                                        <Clipboard className="w-3 h-3 mr-1" />
                                        Có thể dán ảnh bằng Ctrl+V
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files || []);
                                            files.forEach(file => handleFileUpload(file, "IMAGE"));
                                        }}
                                    />

                                    <div className="grid grid-cols-2 gap-3">
                                        {imageFiles.map((file, index) => (
                                            <div key={getItemKey(file)} className="relative group">
                                                <img
                                                    src={file.url}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-full h-32 object-cover rounded-md border border-green-200 cursor-pointer"
                                                    onClick={() => setPreviewImage(file.url)}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFile(getItemKey(file))}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    ×
                                                </button>

                                                <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {index > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => moveImage(index, index - 1)}
                                                            className="bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                                        >
                                                            ↑
                                                        </button>
                                                    )}
                                                    {index < imageFiles.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => moveImage(index, index + 1)}
                                                            className="bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                                        >
                                                            ↓
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Questions Section */}
                        <div className={`${(formData.requiredImage ?? 0) > 0 || [ToeicPart.CUSTOM, ToeicPart.PART_1, ToeicPart.PART_3, ToeicPart.PART_4, ToeicPart.PART_6, ToeicPart.PART_7].includes(formData?.questionPart!) ? "col-span-7" : "col-span-12"} h-full`}>
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 h-full flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-blue-900">
                                        Câu hỏi ({formData.questions?.length || 0})
                                    </h3>

                                    {(() => {
                                        const currentTemplate = formData.questionPart
                                            ? PART_TEMPLATES[formData.questionPart]
                                            : null;
                                        const currentQuestionCount = formData.questions?.length || 0;
                                        const canAddMoreQuestions =
                                            formData.questionPart === ToeicPart.PART_7 || formData.questionPart === ToeicPart.CUSTOM &&
                                            // @ts-ignore
                                            currentQuestionCount < (currentTemplate?.maxQuestions || 1);

                                        return canAddMoreQuestions && (
                                            <button
                                                type="button"
                                                onClick={addQuestion}
                                                className="flex items-center bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Thêm câu hỏi
                                            </button>
                                        );
                                    })()}
                                </div>

                                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                                    {formData.questions?.map((question) => (
                                        <div key={getItemKey(question)} className="bg-white border border-blue-200 rounded-md p-3">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <span className="h-[30px] bg-blue-100 text-blue-800 px-2 py-[5px] rounded-[5px] text-sm font-medium">
                                                        Câu {question.questionNumber}
                                                    </span>

                                                    <div
                                                        className="
                                                            [&_.ant-select-selector]:!py-0
                                                            [&_.ant-select-selector]:!rounded-[5px]
                                                            [&_.ant-select-selector]:!px-2
                                                            [&_.ant-select-selector]:!pr-7
                                                            [&_.ant-select-selector]:!h-[30px]
                                                            [&_.ant-select-selection-overflow]:!flex-nowrap
                                                            [&_.ant-select-selection-overflow]:!overflow-x-auto
                                                            [&_.ant-select-selection-overflow]:scrollbar-thin
                                                            [&_.ant-select-selection-overflow]:!max-w-[400px]
                                                          "
                                                    >
                                                        <Select
                                                            mode="multiple"
                                                            allowClear
                                                            showSearch
                                                            placeholder="Chọn tag"
                                                            className="h-[30px] min-w-[250px]"
                                                            value={(question.tags || []).map(tag => tag.id)}
                                                            onChange={(values) => updateQuestionTags(getItemKey(question), values)}
                                                            options={(allQuestionTags || []).map(tag => ({
                                                                label: tag.tagName,
                                                                value: tag.id,
                                                            }))}
                                                            filterOption={(input, option) =>
                                                                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                                                            }
                                                        />
                                                    </div>

                                                </div>

                                                {(formData.questionPart === ToeicPart.PART_7 && formData.questions!.length > (PART_TEMPLATES[ToeicPart.PART_7].minQuestions || 2))
                                                    ||
                                                    (formData.questionPart === ToeicPart.CUSTOM)
                                                    && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeQuestion(getItemKey(question))}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                            </div>

                                            {![ToeicPart.PART_1, ToeicPart.PART_2, ToeicPart.PART_6].includes(formData.questionPart!) && (
                                                <div className="mb-2">
                                                    <label className="block mb-2 text-sm font-medium text-secondary-700">
                                                        Nội dung câu hỏi <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        rows={1}
                                                        maxLength={500} // ✅ giới hạn nhập
                                                        className="w-full p-3 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                        placeholder="Nhập nội dung câu hỏi (tối đa 500 ký tự)"
                                                        value={question.questionText || ""}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            if (value.length > 500) {
                                                                message.warning("Nội dung câu hỏi không được vượt quá 500 ký tự");
                                                                return;
                                                            }
                                                            updateQuestion(getItemKey(question), "questionText", value);
                                                        }}
                                                    />
                                                </div>
                                            )}

                                            {/* Answers Section */}
                                            <div className="rounded-md border border-gray-200 p-2 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                      Đáp án ({question.answers?.length || 0})
                                                    </span>

                                                    {(() => {
                                                        const currentTemplate = formData.questionPart
                                                            ? PART_TEMPLATES[formData.questionPart]
                                                            : null;
                                                        const currentAnswerCount = question.answers?.length || 0;
                                                        const maxAnswers = currentTemplate?.answersPerQuestion || 4;

                                                        const canAddAnswer = formData.questionPart === ToeicPart.CUSTOM || currentAnswerCount < maxAnswers;

                                                        return canAddAnswer && (
                                                            <button
                                                                type="button"
                                                                onClick={() => addAnswer(getItemKey(question))}
                                                                className="flex items-center text-xs text-white bg-green-600 px-2 py-[2px] rounded hover:bg-green-700 active:scale-[0.97] transition"
                                                            >
                                                                <Plus className="w-3 h-3 mr-1" />
                                                                Thêm
                                                            </button>
                                                        );
                                                    })()}
                                                </div>

                                                {question.answers?.map((answer, aIndex) => (
                                                    <div
                                                        key={getItemKey(answer)}
                                                        className={`
                                                            flex items-center gap-2 rounded px-2 py-[4px] text-sm mb-[3px]
                                                            border ${answer.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}
                                                            transition
                                                        `}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setCorrectAnswer(getItemKey(question), getItemKey(answer))
                                                            }
                                                            className={`p-[3px] rounded-full ${
                                                                answer.isCorrect
                                                                    ? 'text-green-600 hover:text-green-700'
                                                                    : 'text-gray-400 hover:text-gray-600'
                                                            }`}
                                                            title="Đánh dấu là đáp án đúng"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>

                                                        <span
                                                            className={`text-xs font-semibold px-[6px] py-[1px] rounded ${
                                                                answer.isCorrect
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}
                                                        >
                                                            {String.fromCharCode(65 + aIndex)}
                                                        </span>

                                                        {![ToeicPart.PART_1, ToeicPart.PART_2].includes(formData.questionPart!) ? (
                                                            // Các part 3–7: có nội dung đáp án
                                                            <textarea
                                                                rows={1}
                                                                maxLength={200} // ✅ giới hạn nhập
                                                                className="flex-1 resize-none text-sm px-1 py-[3px] bg-transparent border-none outline-none focus:ring-0 placeholder-gray-400 leading-snug overflow-hidden min-h-[28px]"
                                                                placeholder="Nhập đáp án (tối đa 300 ký tự)"
                                                                value={answer.content || ""}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (value.length > 300) {
                                                                        message.warning("Đáp án không được vượt quá 300 ký tự");
                                                                        return;
                                                                    }
                                                                    updateAnswer(getItemKey(question), getItemKey(answer), "content", value);
                                                                }}
                                                                onInput={(e) => {
                                                                    const target = e.target as HTMLTextAreaElement;
                                                                    target.style.height = "auto";
                                                                    target.style.height = `${target.scrollHeight}px`;
                                                                }}
                                                            />
                                                        ) : (
                                                            // Part 1–2: chỉ tick được đáp án đúng
                                                            <div className="flex-1 text-gray-500 italic text-sm select-none">
                                                                (Chọn đáp án đúng)
                                                            </div>
                                                        )}


                                                        {question.answers!.length >
                                                            (PART_TEMPLATES[formData.questionPart!]?.answersPerQuestion || 0) && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeAnswer(getItemKey(question), getItemKey(answer))
                                                                    }
                                                                    className="text-red-400 hover:text-red-600 p-[2px]"
                                                                    title="Xóa đáp án"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )
                                                        }
                                                    </div>
                                                ))}
                                            </div>

                                        </div>
                                    ))}
                                </div>

                                {formData.questions?.length === 0 && (
                                    <div className="text-center text-gray-500 py-8">
                                        <p>Chưa có câu hỏi nào. Nhấp "Thêm câu hỏi" để bắt đầu.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-6">
                            <label className="block mb-2 text-sm font-medium text-secondary-700">
                                Giải thích
                            </label>

                            <TextEditor
                                value={formData.explanation || ""}
                                onChange={(e) => handleChange("explanation", e)}
                                placeholder="Nhập giải thích"
                                height={300}
                                enableImages={false}
                                enableVideos={false}
                            />
                        </div>

                        <div className="col-span-6">
                            <label className="block mb-2 text-sm font-medium text-secondary-700">
                                Ghi chú
                            </label>

                            <TextEditor
                                value={formData.notes || ""}
                                onChange={(e) => handleChange("notes", e)}
                                placeholder="Nhập ghi chú"
                                height={300}
                                enableImages={false}
                                enableVideos={false}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                        {isSaving && (
                            <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"></path>
                            </svg>
                        )}
                        {mode === "create" ? "Thêm mới" : "Cập nhật"}
                    </button>
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={previewImage}
                            className="max-h-[80vh] max-w-[90vw] rounded-lg shadow-xl"
                        />
                        <button
                            className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl"
                            onClick={() => setPreviewImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionGroupFormModal;