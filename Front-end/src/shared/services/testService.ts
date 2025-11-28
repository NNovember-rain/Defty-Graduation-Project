import { get, postJsonData } from "./request";
import handleRequest from "./handleRequest";

const TEST_EVALUATION_SERVICE_PREFIX: string = import.meta.env
    .VITE_PREFIX_TEST_EVALUATION_SERVICE as string;

// ================================================================
//  INTERFACES
// ================================================================

export interface UserAnswerDetail {
    questionGroupId?: string
    questionId: string;
    answerId: string | null;
    questionPart: string;
    questionNumber: number;
}

export interface SubmitTestRequest {
    testsetId: string;
    testsetName: string;
    isFulltest: boolean;
    partsTaken: string[];
    userAnswers: UserAnswerDetail[];
    completionTime: number;
}

export interface AnswerDetail {
    questionId: string;
    questionNumber: number;
    questionPart: string;
    selectedAnswerId: string | null;
    correctAnswerId: string;
    isCorrect: boolean;
    isSkipped: boolean;
}

export interface PartStatistic {
    partName: string;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    accuracy: number;
}

export interface SummaryInfo {
    summaryId: string | null;
    userId: string | null;
    testsetId: string | null;
    testsetName: string | null;
    totalAttempts: number;
    bestScore: number;
    latestScore: number;
    bestListeningScore: number;
    bestReadingScore: number;
    averageScore: number;
}

export interface ScoringResultResponse {
    attemptId: string;
    attemptNumber: number;
    completionTime: number;
    partsTaken: string[];
    summaryInfo: SummaryInfo;
    totalScore: number | null;
    listeningScore: number | null;
    readingScore: number | null;
    lcCorrectAnswers: number;
    rcCorrectAnswers: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    answerDetails: Record<string, AnswerDetail>;
    partStatistics: Record<string, PartStatistic>;
    createdDate: string;
}

export interface TestAttemptSummaryResponse {
    attemptId: string;
    attemptNumber: number;
    testsetId: string;
    testsetName: string;
    isFulltest: boolean;
    partsTaken: string[];
    totalScore: number | null;
    listeningScore: number | null;
    readingScore: number | null;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    completionTime: number;
    createdDate: string;
}


export interface TestAttemptReportResponse {
    attemptId: string;
    attemptNumber: number;
    testsetId: string;
    testsetName: string;
    isFulltest: boolean;
    partsTaken: string[];
    totalScore: number;
    listeningScore: number;
    readingScore: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    completionTime: number;
    createdDate: string;
}

export interface ClassAttemptSummary {
    attemptId: string;
    attemptNumber: number;
    userId: number;
    fullName: string;
    testsetId: string;
    testsetName: string;
    isFulltest: boolean;
    partsTaken: string[];
    totalScore: number | null;
    listeningScore: number | null;
    readingScore: number | null;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    completionTime: number;
    accuracy: number;
    createdDate: string;
}

export interface ClassTestHistoryResponse {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
    attempts: ClassAttemptSummary[];
}

export interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
    errorCode?: string;
}

// ================================================================
//  API FUNCTIONS
// ================================================================

/**
 * Submit test và nhận kết quả chấm điểm
 */
export const submitTest = async (
    request: SubmitTestRequest
): Promise<ApiResponse<ScoringResultResponse>> => {
    const response = await handleRequest(
        postJsonData(
            `${TEST_EVALUATION_SERVICE_PREFIX}/submit-test/accessible`,
            request
        )
    );

    const result = (await response.json()) as ApiResponse<ScoringResultResponse>;

    if (result.status !== 200) {
        const rawMessage = result.message || "Nộp bài thất bại";
        const formattedMessage = rawMessage.includes(":")
            ? rawMessage.split(":").slice(1).join(":").trim()
            : rawMessage;

        throw new Error(formattedMessage);
    }

    return result;
};

/**
 * Lấy chi tiết một lần làm bài từ attemptId
 */
export const getAttemptDetail = async (
    attemptId: string
): Promise<ApiResponse<ScoringResultResponse>> => {
    const response = await handleRequest(
        get(`${TEST_EVALUATION_SERVICE_PREFIX}/test-history/attempt/${attemptId}`)
    );

    const result = (await response.json()) as ApiResponse<ScoringResultResponse>;

    if (result.status !== 200) {
        throw new Error(result.message || "Không thể tải chi tiết bài làm");
    }

    return result;
};

/**
 * Lấy lịch sử làm bài của user cho một testset
 */
export const getUserTestHistory = async (
    testsetId: string,
    page: number = 0,
    size: number = 10
): Promise<ApiResponse<{ content: TestAttemptSummaryResponse[] }>> => {
    const response = await handleRequest(
        get(
            `${TEST_EVALUATION_SERVICE_PREFIX}/test-history/testset/${testsetId}?page=${page}&size=${size}`
        )
    );

    const result = (await response.json()) as ApiResponse<{
        content: TestAttemptSummaryResponse[];
    }>;

    if (result.status !== 200) {
        throw new Error(result.message || "Không thể tải lịch sử làm bài");
    }

    return result;
};

/**
 * Lấy toàn bộ lịch sử làm bài của user (tất cả testset)
 */
export const getUserAllHistory = async (
    page: number = 0,
    size: number = 10
): Promise<ApiResponse<{ content: TestAttemptSummaryResponse[] }>> => {
    const response = await handleRequest(
        get(`${TEST_EVALUATION_SERVICE_PREFIX}/test-history/user/all?page=${page}&size=${size}`)
    );

    const result = (await response.json()) as ApiResponse<{
        content: TestAttemptSummaryResponse[];
    }>;

    if (result.status !== 200) {
        throw new Error(result.message || "Không thể tải toàn bộ lịch sử làm bài của người dùng");
    }

    return result;
};


/**
 * Lấy lịch sử làm bài fulltest mới nhất của học viên trong lớp
 * @param classId - ID của lớp học
 * @param testsetId - (Optional) ID của testset cụ thể
 */
export const getClassLatestFulltests = async (
    classId: number,
    testsetId?: string
): Promise<ApiResponse<ClassTestHistoryResponse>> => {
    const url = testsetId
        ? `${TEST_EVALUATION_SERVICE_PREFIX}/test-history/class/${classId}/latest-fulltests?testsetId=${testsetId}`
        : `${TEST_EVALUATION_SERVICE_PREFIX}/test-history/class/${classId}/latest-fulltests`;

    const response = await handleRequest(get(url));

    const result = (await response.json()) as ApiResponse<ClassTestHistoryResponse>;

    if (result.status !== 200) {
        throw new Error(result.message || "Không thể tải lịch sử làm bài của lớp");
    }

    return result;
};

function formatLocalDateTime(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const getUserReportData = async (
    fromDate?: Date,
    toDate?: Date
): Promise<ApiResponse<TestAttemptReportResponse[]>> => {
    const params = new URLSearchParams();

    if (fromDate) {
        params.append('fromDate', formatLocalDateTime(fromDate));
    }
    if (toDate) {
        params.append('toDate', formatLocalDateTime(toDate));
    }

    const response = await handleRequest(
        get(`${TEST_EVALUATION_SERVICE_PREFIX}/test-history/user/report?${params.toString()}`)
    );

    const result = await response.json() as ApiResponse<TestAttemptReportResponse[]>;

    if (result.status !== 200) {
        throw new Error(result.message || "Không thể tải dữ liệu báo cáo");
    }

    return result;
};

// ================================================================
//  HELPER FUNCTIONS
// ================================================================

export const createUserAnswerDetail = (
    questionId: string,
    answerId: string | null,
    questionPart: string,
    questionNumber: number
): UserAnswerDetail => {
    return {
        questionId,
        answerId,
        questionPart,
        questionNumber,
    };
};

export const convertAnswersToUserAnswerDetails = (
    answers: Record<number, string>,
    questionGroups: any[],
    questionGroupOrders: Map<string, number>
): UserAnswerDetail[] => {
    const userAnswers: UserAnswerDetail[] = [];

    questionGroups.forEach((group) => {
        const baseOrder = questionGroupOrders.get(group.id);

        if (baseOrder === undefined) {
            console.warn('⚠️ No order found for group:', group.id);
            return;
        }

        group.questions.forEach((question: any, index: number) => {
            const absoluteQuestionNum = baseOrder + index;
            const selectedAnswerLetter = answers[absoluteQuestionNum];

            let answerId: string | null = null;
            if (selectedAnswerLetter) {
                const answerIndex = selectedAnswerLetter.charCodeAt(0) - 65;
                if (question.answers[answerIndex]) {
                    answerId = question.answers[answerIndex].id;
                }
            }

            userAnswers.push({
                questionGroupId: group.id,
                questionId: question.id,
                answerId,
                questionPart: group.questionPart,
                questionNumber: question.questionNumber,
            });
        });
    });

    return userAnswers;
};

export const calculateCompletionTime = (
    startTime: number,
    endTime: number = Date.now()
): number => {
    return Math.floor((endTime - startTime) / 1000);
};

export const getPartsTakenFromQuestionGroups = (
    questionGroups: any[]
): string[] => {
    const parts = new Set<string>();
    questionGroups.forEach((group) => {
        parts.add(group.questionPart);
    });
    return Array.from(parts);
};

export const formatResultForDisplay = (
    result: ScoringResultResponse,
    testData: any
): any => {
    return {
        ...result,
        testName: testData.testName,
        testSetId: testData.testSetId,
        timestamp: new Date().toISOString(),
    };
};