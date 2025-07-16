import { Schema, model, Document } from 'mongoose';

export interface IExternalAIModelConfig extends Document {
    providerName: string;
    modelName: string;
    endpointUrl: string;
    defaultTemperature?: number;
    maxTokensLimit?: number;
    featuresSupported?: string[];
    costPerTokenInput?: number;
    costPerTokenOutput?: number;
    status: 'active' | 'deprecated' | 'beta';
}

const ExternalAIModelConfigSchema = new Schema<IExternalAIModelConfig>({
    providerName: { type: String, required: true, trim: true },
    modelName: { type: String, required: true, unique: true, trim: true },
    endpointUrl: { type: String, required: true, trim: true },
    defaultTemperature: { type: Number, min: 0, max: 1, default: 0.7 },
    maxTokensLimit: { type: Number, min: 1 },
    featuresSupported: [{ type: String }],
    costPerTokenInput: { type: Number, min: 0 },
    costPerTokenOutput: { type: Number, min: 0 },
    status: { type: String, required: true, enum: ['active', 'deprecated', 'beta'], default: 'active' },
}, { timestamps: true });

const ExternalAIModelConfig = model<IExternalAIModelConfig>('ExternalAIModelConfig', ExternalAIModelConfigSchema);

export default ExternalAIModelConfig;