import { Schema, model, Document } from 'mongoose';

export interface IPrompt extends Document {
    name: string;
    description?: string;
    templateString: string;
    type: string;
    version: string;
    createdBy?: number;
    isDeleted: boolean;
    isActive: boolean;
}

const PromptSchema = new Schema<IPrompt>({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    templateString: { type: String, required: true },
    type: { type: String, required: true, trim: true },
    version: { type: String, required: true, default: '1.0' },
    createdBy: { type: Number },
    isDeleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false }
}, { timestamps: true });

const Prompt = model<IPrompt>('Prompt', PromptSchema);

export default Prompt;