import * as ExcelJS from 'exceljs';

export interface ExcelTemplateData {
    metadata: {
        title: string;
        assignment: string;
        solutionCode: string;
        typeUml: string;
    };
    entries: Array<{
        studentPlantUMLCode: string;
        studentInfo: string;
    }>;
}

export interface AutoFeedbackJobDetail {
    title: string;
    typeUml: string;
    assignment: string;
    solutionCode: string;
    entries: Array<{
        studentPlantUMLCode: string;
        studentInfo: string;
        feedBackLLM?: string;
        score?: number;
    }>;
}

export class ExcelGenerator {
    static async generateAutoFeedbackJobTemplate(data: ExcelTemplateData): Promise<void> {
        // Tạo workbook mới với ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('AutoFeedbackJob');

        // Thiết lập độ rộng cột
        worksheet.getColumn('A').width = 35; // StudentInfo
        worksheet.getColumn('B').width = 60; // StudentPlantUMLCode

        // Style cho metadata labels (in đậm, căn giữa)
        const metadataLabelStyle = {
            font: { bold: true, size: 12, name: 'Calibri' },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
        };

        // Style cho metadata values
        const metadataValueStyle = {
            font: { size: 11, name: 'Calibri' },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: true }
        };

        // Style cho headers (in đậm, màu xanh, chữ trắng)
        const headerStyle = {
            font: { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF366092' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
        };

        // Thêm metadata (4 dòng đầu) - Template có 2 cột nên không cần merge
        worksheet.getCell('A1').value = 'Title';
        worksheet.getCell('A1').style = metadataLabelStyle;
        worksheet.getCell('B1').value = data.metadata.title;
        worksheet.getCell('B1').style = metadataValueStyle;
        worksheet.getRow(1).height = 25;

        worksheet.getCell('A2').value = 'Assignment';
        worksheet.getCell('A2').style = metadataLabelStyle;
        worksheet.getCell('B2').value = data.metadata.assignment;
        worksheet.getCell('B2').style = metadataValueStyle;
        worksheet.getRow(2).height = 25;

        worksheet.getCell('A3').value = 'Solution Code';
        worksheet.getCell('A3').style = metadataLabelStyle;
        worksheet.getCell('B3').value = data.metadata.solutionCode;
        worksheet.getCell('B3').style = metadataValueStyle;
        worksheet.getRow(3).height = 80;

        worksheet.getCell('A4').value = 'Type Uml';
        worksheet.getCell('A4').style = metadataLabelStyle;
        worksheet.getCell('B4').value = data.metadata.typeUml;
        worksheet.getCell('B4').style = metadataValueStyle;
        worksheet.getRow(4).height = 25;

        // Dòng 5 để trống
        worksheet.getRow(5).height = 15;

        // Headers (dòng 6)
        worksheet.getCell('A6').value = 'Student Information';
        worksheet.getCell('A6').style = headerStyle;
        worksheet.getCell('B6').value = 'Student PlantUML Code';
        worksheet.getCell('B6').style = headerStyle;
        worksheet.getRow(6).height = 30;

        // Style cho data
        const dataStyle = {
            font: { size: 12, name: 'Calibri' },
            fill: { 
                type: 'pattern' as const, 
                pattern: 'solid' as const, 
                fgColor: { argb: 'FFFFFFFF' } 
            },
            border: {
                top: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } }
            },
            alignment: { horizontal: 'left' as const, vertical: 'top' as const, wrapText: true }
        };

        // Thêm entries mẫu (từ dòng 7)
        data.entries.forEach((entry, index) => {
            const rowNum = 7 + index;
            worksheet.getCell(`A${rowNum}`).value = entry.studentInfo;
            worksheet.getCell(`A${rowNum}`).style = dataStyle;
            worksheet.getCell(`B${rowNum}`).value = entry.studentPlantUMLCode;
            worksheet.getCell(`B${rowNum}`).style = dataStyle;
            worksheet.getRow(rowNum).height = 60;
        });

        // Thêm 30 dòng trống cho sinh viên (sau các entries mẫu)
        const startEmptyRow = 7 + data.entries.length;
        for (let i = 0; i < 30; i++) {
            const rowNum = startEmptyRow + i;
            worksheet.getCell(`A${rowNum}`).value = '';
            worksheet.getCell(`A${rowNum}`).style = dataStyle;
            worksheet.getCell(`B${rowNum}`).value = '';
            worksheet.getCell(`B${rowNum}`).style = dataStyle;
            worksheet.getRow(rowNum).height = 60;
        }

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'auto_feedback_job_template.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
    
    static async downloadAutoFeedbackExcelWithData(fileName: string, jobDetail: AutoFeedbackJobDetail): Promise<void> {
        // Tạo workbook mới với ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('AutoFeedbackResult');

        // Thiết lập độ rộng cột
        worksheet.getColumn('A').width = 35; // StudentInfo
        worksheet.getColumn('B').width = 60; // StudentPlantUMLCode
        worksheet.getColumn('C').width = 80; // FeedbackLlm
        worksheet.getColumn('D').width = 15; // Score

        // Style cho metadata labels
        const metadataLabelStyle = {
            font: { bold: true, size: 12, name: 'Calibri' },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
        };

        // Style cho metadata values
        const metadataValueStyle = {
            font: { size: 11, name: 'Calibri' },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'left' as const, vertical: 'middle' as const, wrapText: true }
        };

        // Style cho headers
        const headerStyle = {
            font: { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } },
            fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF366092' } },
            border: {
                top: { style: 'thin' as const },
                bottom: { style: 'thin' as const },
                left: { style: 'thin' as const },
                right: { style: 'thin' as const }
            },
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
        };

        // Thêm metadata (4 dòng đầu) - Áp dụng style cho tất cả các ô được merge
        worksheet.getCell('A1').value = 'Title';
        worksheet.getCell('A1').style = metadataLabelStyle;
        worksheet.mergeCells('B1:D1');
        worksheet.getCell('B1').value = jobDetail.title;
        // Áp dụng style cho tất cả các ô trong range merge
        ['B1', 'C1', 'D1'].forEach(cellRef => {
            worksheet.getCell(cellRef).style = metadataValueStyle;
        });
        worksheet.getRow(1).height = 25;

        worksheet.getCell('A2').value = 'Assignment';
        worksheet.getCell('A2').style = metadataLabelStyle;
        worksheet.mergeCells('B2:D2');
        worksheet.getCell('B2').value = jobDetail.assignment;
        ['B2', 'C2', 'D2'].forEach(cellRef => {
            worksheet.getCell(cellRef).style = metadataValueStyle;
        });
        worksheet.getRow(2).height = 25;

        worksheet.getCell('A3').value = 'Solution Code';
        worksheet.getCell('A3').style = metadataLabelStyle;
        worksheet.mergeCells('B3:D3');
        worksheet.getCell('B3').value = jobDetail.solutionCode;
        ['B3', 'C3', 'D3'].forEach(cellRef => {
            worksheet.getCell(cellRef).style = metadataValueStyle;
        });
        worksheet.getRow(3).height = 80;

        worksheet.getCell('A4').value = 'Type UML';
        worksheet.getCell('A4').style = metadataLabelStyle;
        worksheet.mergeCells('B4:D4');
        worksheet.getCell('B4').value = jobDetail.typeUml;
        ['B4', 'C4', 'D4'].forEach(cellRef => {
            worksheet.getCell(cellRef).style = metadataValueStyle;
        });
        worksheet.getRow(4).height = 25;

        // Dòng 5 để trống
        worksheet.getRow(5).height = 15;

        // Headers (dòng 6)
        worksheet.getCell('A6').value = 'Student Information';
        worksheet.getCell('A6').style = headerStyle;
        worksheet.getCell('B6').value = 'Student PlantUML Code';
        worksheet.getCell('B6').style = headerStyle;
        worksheet.getCell('C6').value = 'Feedback LLM';
        worksheet.getCell('C6').style = headerStyle;
        worksheet.getCell('D6').value = 'Score';
        worksheet.getCell('D6').style = headerStyle;
        worksheet.getRow(6).height = 30;

        // Style cho data
        const dataStyle = {
            font: { size: 11, name: 'Calibri' },
            fill: { 
                type: 'pattern' as const, 
                pattern: 'solid' as const, 
                fgColor: { argb: 'FFFFFFFF' } 
            },
            border: {
                top: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                bottom: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                left: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } },
                right: { style: 'thin' as const, color: { argb: 'FFCCCCCC' } }
            },
            alignment: { horizontal: 'left' as const, vertical: 'top' as const, wrapText: true }
        };

        const scoreStyle = {
            ...dataStyle,
            alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
        };

        // Thêm dữ liệu entries
        jobDetail.entries.forEach((entry, index) => {
            const rowNum = 7 + index;
            
            worksheet.getCell(`A${rowNum}`).value = entry.studentInfo;
            worksheet.getCell(`A${rowNum}`).style = dataStyle;
            
            worksheet.getCell(`B${rowNum}`).value = entry.studentPlantUMLCode;
            worksheet.getCell(`B${rowNum}`).style = dataStyle;
            
            worksheet.getCell(`C${rowNum}`).value = entry.feedBackLLM || '';
            worksheet.getCell(`C${rowNum}`).style = dataStyle;
            
            worksheet.getCell(`D${rowNum}`).value = entry.score || '';
            worksheet.getCell(`D${rowNum}`).style = scoreStyle;
            
            worksheet.getRow(rowNum).height = 80;
        });

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    static generateSampleData(): ExcelTemplateData {
        return {
            metadata: {
                title: 'Sample Auto Feedback Job Title',
                assignment: 'Sample Assignment Name',
                solutionCode: '@startuml\nclass Teacher {\n  +name: String\n  +subject: String\n  +teach(): void\n}\n@enduml',
                typeUml: 'CLASS_DIAGRAM'
            },
            entries: [
                {
                    studentPlantUMLCode: '@startuml\nclass Student {\n  +name: String\n  +id: String\n  +study(): void\n}\n@enduml',
                    studentInfo: 'Nguyen Van A - MSSV: 2021001'
                }
            ]
        };
    }
}