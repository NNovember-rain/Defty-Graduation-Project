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