import { Schema, model, Document } from 'mongoose';

export interface IPrompt extends Document {
    name: string;
    description?: string;
    templateString: string;
    type?: 'system' | 'user' | 'template';
    version: string;
    createdBy?: number;
    isDeleted?: boolean;
}

const PromptSchema = new Schema<IPrompt>({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    templateString: { type: String, required: true },
    type: { type: String, enum: ['system', 'user', 'template'] },
    version: { type: String, required: true },
    createdBy: { type: Number },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Prompt = model<IPrompt>('Prompt', PromptSchema);

export default Prompt;