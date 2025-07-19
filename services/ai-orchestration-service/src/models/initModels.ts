import Prompt from './prompt.model';

export const initModels = async (): Promise<void> => {
    console.log('Checking and ensuring MongoDB collections...');
    try {
        await Prompt.createCollection();
        console.log('Collection "prompts" ensured to exist.');
    } catch (collectionError: any) {
        if (collectionError.code === 48) {
            console.log('Collection "prompts" already exists, skipping creation.');
        } else {
            console.error('Error creating collection "prompts":', collectionError.message);
        }
    }
};

export const runPromptMigration = async (): Promise<void> => {
    console.log('Bắt đầu quá trình migration cho Prompt models...');
    try {
        const result = await Prompt.updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );

        console.log('Migration hoàn tất.');
        console.log(`Đã cập nhật ${result.modifiedCount} document.`);
        console.log(`Đã tìm thấy ${result.matchedCount} document khớp.`);

    } catch (error: any) {
        console.error('Lỗi trong quá trình migration:', error.message);
    }
};