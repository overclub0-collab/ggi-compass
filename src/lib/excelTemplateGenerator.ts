import ExcelJS from 'exceljs';

/**
 * Generate and download an Excel template with image insertion guide
 */
export const downloadExcelTemplateWithImageGuide = async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GGI Admin';
  workbook.created = new Date();

  // Create main data sheet
  const dataSheet = workbook.addWorksheet('제품 데이터', {
    properties: { tabColor: { argb: '4F81BD' } },
  });

  // Define columns with headers
  const headers = [
    { header: '품명 *', key: 'title', width: 30 },
    { header: '슬러그', key: 'slug', width: 25 },
    { header: '규격', key: 'specs', width: 30 },
    { header: '조달번호', key: 'procurement_id', width: 15 },
    { header: '가격', key: 'price', width: 12 },
    { header: '제품설명', key: 'description', width: 40 },
    { header: '이미지 (여기에 삽입)', key: 'image', width: 20 },
    { header: '뱃지', key: 'badges', width: 20 },
    { header: '특징', key: 'features', width: 30 },
    { header: '대분류', key: 'main_category', width: 15 },
    { header: '소분류', key: 'subcategory', width: 15 },
    { header: '순서', key: 'display_order', width: 8 },
  ];

  dataSheet.columns = headers;

  // Style header row
  const headerRow = dataSheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '4F81BD' },
    };
    cell.font = {
      color: { argb: 'FFFFFF' },
      bold: true,
      size: 11,
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Add sample data rows with row height for images
  const sampleData = [
    {
      title: '예시 제품 1',
      slug: 'example-product-1',
      specs: 'W1200 x D600 x H750',
      procurement_id: '12345678',
      price: '500,000',
      description: '제품 설명을 입력하세요',
      image: '← 이미지를 이 셀에 삽입하세요',
      badges: 'MAS 등록, KS 인증',
      features: '특징1 | 특징2 | 특징3',
      main_category: 'educational',
      subcategory: 'blackboard-cabinet',
      display_order: 1,
    },
    {
      title: '예시 제품 2',
      slug: 'example-product-2',
      specs: 'W800 x D500 x H1800',
      procurement_id: '87654321',
      price: '350,000',
      description: '두 번째 제품 설명',
      image: '← 이미지를 이 셀에 삽입하세요',
      badges: '친환경',
      features: '내구성 우수 | 조립 간편',
      main_category: 'office',
      subcategory: 'cabinet',
      display_order: 2,
    },
  ];

  sampleData.forEach((data, index) => {
    const row = dataSheet.addRow(data);
    row.height = 80; // Set row height for image visibility
    
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CCCCCC' } },
        left: { style: 'thin', color: { argb: 'CCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
        right: { style: 'thin', color: { argb: 'CCCCCC' } },
      };
    });

    // Highlight image cell
    const imageCell = row.getCell('image');
    imageCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF2CC' },
    };
    imageCell.font = {
      color: { argb: 'BF8F00' },
      italic: true,
      size: 10,
    };
  });

  // Create instruction sheet
  const guideSheet = workbook.addWorksheet('이미지 삽입 가이드', {
    properties: { tabColor: { argb: '70AD47' } },
  });

  guideSheet.getColumn(1).width = 60;

  const instructions = [
    ['📸 엑셀 이미지 삽입 가이드'],
    [''],
    ['이 템플릿을 사용하면 엑셀에 삽입된 이미지가 자동으로 업로드됩니다.'],
    [''],
    ['=== 이미지 삽입 방법 ==='],
    [''],
    ['1. "제품 데이터" 시트로 이동합니다.'],
    ['2. 이미지를 삽입할 행의 "이미지" 열(G열)을 선택합니다.'],
    ['3. 리본 메뉴 > 삽입 > 그림 > 이 장치를 클릭합니다.'],
    ['4. 원하는 이미지 파일을 선택합니다.'],
    ['5. 이미지가 해당 셀 위에 배치되도록 크기를 조절합니다.'],
    [''],
    ['=== 중요 사항 ==='],
    [''],
    ['• 지원 형식: PNG, JPG, JPEG, GIF, WEBP'],
    ['• 최대 용량: 이미지당 5MB'],
    ['• 행당 최대 이미지: 3개'],
    ['• 이미지는 행 번호 기준으로 제품과 매핑됩니다.'],
    ['• 같은 행에 여러 이미지를 넣으면 순서대로 등록됩니다.'],
    [''],
    ['=== 이미지 위치 팁 ==='],
    [''],
    ['• 이미지를 셀 안에 완전히 넣지 않아도 됩니다.'],
    ['• 이미지의 왼쪽 상단 모서리가 있는 행이 기준입니다.'],
    ['• 예: 이미지가 2행에서 시작하면 첫 번째 제품에 매핑'],
    [''],
    ['=== 기존 URL 방식도 지원 ==='],
    [''],
    ['이미지 URL을 직접 입력하는 것도 가능합니다.'],
    ['CSV 템플릿의 이미지URL/추가이미지1/추가이미지2 열을 사용하세요.'],
  ];

  instructions.forEach((row, index) => {
    const excelRow = guideSheet.addRow(row);
    if (index === 0) {
      excelRow.font = { bold: true, size: 16, color: { argb: '2E7D32' } };
      excelRow.height = 30;
    } else if (row[0]?.startsWith('===')) {
      excelRow.font = { bold: true, size: 12, color: { argb: '1565C0' } };
    }
  });

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '제품_업로드_템플릿_이미지가이드.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
