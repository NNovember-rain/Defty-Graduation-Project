const handleRequest = async (request: Promise<Response>): Promise<Response> => {
    try {
        return await request;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export default handleRequest;