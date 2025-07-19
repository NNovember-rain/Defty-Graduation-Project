import { Schema, model, Document } from 'mongoose';

export interface IApiKey extends Document {
    apiKeyHash: string;
    provider: string;
    modelIdAssociated?: Schema.Types.ObjectId;
    ownerType: 'user' | 'organization';
    ownerId: number;
    usageLimitPerPeriod?: number;
    currentUsageCount: number;
    lastUsedAt?: Date;
    status: 'active' | 'inactive' | 'revoked';
    expirationDate?: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
    apiKeyHash: { type: String, required: true, unique: true },
    provider: { type: String, required: true, trim: true },
    modelIdAssociated: { type: Schema.Types.ObjectId, ref: 'ExternalAIModelConfig' },
    ownerType: { type: String, required: true, enum: ['user', 'organization'] },
    ownerId: { type: Number, required: true, refPath: 'ownerType' },
    usageLimitPerPeriod: { type: Number, min: 0 },
    currentUsageCount: { type: Number, required: true, default: 0, min: 0 },
    lastUsedAt: { type: Date },
    status: { type: String, required: true, enum: ['active', 'inactive', 'revoked'], default: 'active' },
    expirationDate: { type: Date },
}, { timestamps: true });

const ApiKey = model<IApiKey>('ApiKey', ApiKeySchema);

export default ApiKey;