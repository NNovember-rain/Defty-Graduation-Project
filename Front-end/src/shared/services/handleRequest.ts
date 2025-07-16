const handleRequest = async (request: Promise<Response>): Promise<Response> => {
    try {
        const response = await request;
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(`Request failed with status ${response.status}`);
            Object.assign(error, {
                status: response.status,
                data: errorData
            });
            console.error("API Error:", response.status, errorData);
            throw error;
        }
        return response;

    } catch (error) {
        console.error("Network or promise error:", error);
        throw error;
    }
};

export default handleRequest;