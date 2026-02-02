// src/shared/constants/chapters.constant.ts
import { SUBJECT_IDS } from './subjects.constant'

/**
 * Chapters cho môn Toán học - Lớp 10, 11, 12
 * Cấu trúc: Parent chapters (level 0) và Child chapters (level 1)
 */
export const CHAPTERS = [
  // ==================== TOÁN HỌC - LỚP 10 ====================
  // Parent Chapters
  { id: 1, subjectId: SUBJECT_IDS.MATH, code: '10C1', name: 'MỆNH ĐỀ VÀ TẬP HỢP', slug: 'menh-de-va-tap-hop', parentChapterId: null, orderInParent: 1, level: 0 },
  { id: 2, subjectId: SUBJECT_IDS.MATH, code: '10C11', name: 'Mệnh đề', slug: 'menh-de', parentChapterId: 1, orderInParent: 1, level: 1 },
  { id: 3, subjectId: SUBJECT_IDS.MATH, code: '10C12', name: 'Tập hợp và các phép toán trên tập hợp', slug: 'tap-hop-va-cac-phep-toan-tren-tap-hop', parentChapterId: 1, orderInParent: 2, level: 1 },

  { id: 4, subjectId: SUBJECT_IDS.MATH, code: '10C2', name: 'BẤT PHƯƠNG TRÌNH VÀ HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN', slug: 'bat-phuong-trinh-va-he-bat-phuong-trinh-bac-nhat-hai-an', parentChapterId: null, orderInParent: 2, level: 0 },
  { id: 5, subjectId: SUBJECT_IDS.MATH, code: '10C21', name: 'Bất phương trình bậc nhất hai ẩn', slug: 'bat-phuong-trinh-bac-nhat-hai-an', parentChapterId: 4, orderInParent: 1, level: 1 },
  { id: 6, subjectId: SUBJECT_IDS.MATH, code: '10C22', name: 'Hệ bất phương trình bậc nhất hai ẩn', slug: 'he-bat-phuong-trinh-bac-nhat-hai-an', parentChapterId: 4, orderInParent: 2, level: 1 },

  { id: 7, subjectId: SUBJECT_IDS.MATH, code: '10C3', name: 'HỆ THỨC LƯỢNG TRONG TAM GIÁC', slug: 'he-thuc-luong-trong-tam-giac', parentChapterId: null, orderInParent: 3, level: 0 },
  { id: 8, subjectId: SUBJECT_IDS.MATH, code: '10C31', name: 'Giá trị lượng giác của một góc từ 0° đến 180°', slug: 'gia-tri-luong-giac-cua-mot-goc-tu-0-den-180', parentChapterId: 7, orderInParent: 1, level: 1 },
  { id: 9, subjectId: SUBJECT_IDS.MATH, code: '10C32', name: 'Hệ thức lượng trong tam giác', slug: 'he-thuc-luong-trong-tam-giac-2', parentChapterId: 7, orderInParent: 2, level: 1 },

  { id: 10, subjectId: SUBJECT_IDS.MATH, code: '10C4', name: 'VECTƠ', slug: 'vecto', parentChapterId: null, orderInParent: 4, level: 0 },
  { id: 11, subjectId: SUBJECT_IDS.MATH, code: '10C41', name: 'Các khái niệm mở đầu', slug: 'cac-khai-niem-mo-dau', parentChapterId: 10, orderInParent: 1, level: 1 },
  { id: 12, subjectId: SUBJECT_IDS.MATH, code: '10C42', name: 'Tổng và hiệu của hai vectơ', slug: 'tong-va-hieu-cua-hai-vecto', parentChapterId: 10, orderInParent: 2, level: 1 },
  { id: 13, subjectId: SUBJECT_IDS.MATH, code: '10C43', name: 'Tích của một vectơ với một số', slug: 'tich-cua-mot-vecto-voi-mot-so', parentChapterId: 10, orderInParent: 3, level: 1 },
  { id: 14, subjectId: SUBJECT_IDS.MATH, code: '10C44', name: 'Vectơ trong mặt phẳng toạ độ', slug: 'vecto-trong-mat-phang-toa-do', parentChapterId: 10, orderInParent: 4, level: 1 },
  { id: 15, subjectId: SUBJECT_IDS.MATH, code: '10C45', name: 'Tích vô hướng của hai vectơ', slug: 'tich-vo-huong-cua-hai-vecto', parentChapterId: 10, orderInParent: 5, level: 1 },

  { id: 16, subjectId: SUBJECT_IDS.MATH, code: '10C5', name: 'CÁC SỐ ĐẶC TRƯNG CỦA MẪU SỐ LIỆU KHÔNG GHÉP NHÓM', slug: 'cac-so-dac-trung-cua-mau-so-lieu-khong-ghep-nhom', parentChapterId: null, orderInParent: 5, level: 0 },
  { id: 17, subjectId: SUBJECT_IDS.MATH, code: '10C51', name: 'Số gần đúng và sai số', slug: 'so-gan-dung-va-sai-so', parentChapterId: 16, orderInParent: 1, level: 1 },
  { id: 18, subjectId: SUBJECT_IDS.MATH, code: '10C52', name: 'Các số đặc trưng đo xu thế trung tâm', slug: 'cac-so-dac-trung-do-xu-the-trung-tam', parentChapterId: 16, orderInParent: 2, level: 1 },
  { id: 19, subjectId: SUBJECT_IDS.MATH, code: '10C53', name: 'Các số đặc trưng đo độ phân tán', slug: 'cac-so-dac-trung-do-do-phan-tan', parentChapterId: 16, orderInParent: 3, level: 1 },

  { id: 20, subjectId: SUBJECT_IDS.MATH, code: '10C6', name: 'HÀM SỐ, ĐỒ THỊ VÀ ỨNG DỤNG', slug: 'ham-so-do-thi-va-ung-dung', parentChapterId: null, orderInParent: 6, level: 0 },
  { id: 21, subjectId: SUBJECT_IDS.MATH, code: '10C61', name: 'Hàm số', slug: 'ham-so', parentChapterId: 20, orderInParent: 1, level: 1 },
  { id: 22, subjectId: SUBJECT_IDS.MATH, code: '10C62', name: 'Hàm số bậc hai', slug: 'ham-so-bac-hai', parentChapterId: 20, orderInParent: 2, level: 1 },
  { id: 23, subjectId: SUBJECT_IDS.MATH, code: '10C63', name: 'Dấu của tam thức bậc hai', slug: 'dau-cua-tam-thuc-bac-hai', parentChapterId: 20, orderInParent: 3, level: 1 },
  { id: 24, subjectId: SUBJECT_IDS.MATH, code: '10C64', name: 'Phương trình quy về phương trình bậc hai', slug: 'phuong-trinh-quy-ve-phuong-trinh-bac-hai', parentChapterId: 20, orderInParent: 4, level: 1 },

  { id: 25, subjectId: SUBJECT_IDS.MATH, code: '10C7', name: 'PHƯƠNG PHÁP TOẠ ĐỘ TRONG MẶT PHẲNG', slug: 'phuong-phap-toa-do-trong-mat-phang', parentChapterId: null, orderInParent: 7, level: 0 },
  { id: 26, subjectId: SUBJECT_IDS.MATH, code: '10C71', name: 'Phương trình đường thẳng', slug: 'phuong-trinh-duong-thang', parentChapterId: 25, orderInParent: 1, level: 1 },
  { id: 27, subjectId: SUBJECT_IDS.MATH, code: '10C72', name: 'Đường thẳng trong mặt phẳng toạ độ', slug: 'duong-thang-trong-mat-phang-toa-do', parentChapterId: 25, orderInParent: 2, level: 1 },
  { id: 28, subjectId: SUBJECT_IDS.MATH, code: '10C73', name: 'Đường tròn trong mặt phẳng toạ độ', slug: 'duong-tron-trong-mat-phang-toa-do', parentChapterId: 25, orderInParent: 3, level: 1 },
  { id: 29, subjectId: SUBJECT_IDS.MATH, code: '10C74', name: 'Ba đường conic', slug: 'ba-duong-conic', parentChapterId: 25, orderInParent: 4, level: 1 },

  { id: 30, subjectId: SUBJECT_IDS.MATH, code: '10C8', name: 'ĐẠI SỐ TỔ HỢP', slug: 'dai-so-to-hop', parentChapterId: null, orderInParent: 8, level: 0 },
  { id: 31, subjectId: SUBJECT_IDS.MATH, code: '10C81', name: 'Quy tắc đếm', slug: 'quy-tac-dem', parentChapterId: 30, orderInParent: 1, level: 1 },
  { id: 32, subjectId: SUBJECT_IDS.MATH, code: '10C82', name: 'Hoán vị, chỉnh hợp và tổ hợp', slug: 'hoan-vi-chinh-hop-va-to-hop', parentChapterId: 30, orderInParent: 2, level: 1 },
  { id: 33, subjectId: SUBJECT_IDS.MATH, code: '10C83', name: 'Nhị thức Newton', slug: 'nhi-thuc-newton', parentChapterId: 30, orderInParent: 3, level: 1 },

  { id: 34, subjectId: SUBJECT_IDS.MATH, code: '10C9', name: 'TÍNH XÁC SUẤT THEO ĐỊNH NGHĨA CỔ ĐIỂN', slug: 'tinh-xac-suat-theo-dinh-nghia-co-dien', parentChapterId: null, orderInParent: 9, level: 0 },
  { id: 35, subjectId: SUBJECT_IDS.MATH, code: '10C91', name: 'Biến cố và định nghĩa cổ điển của xác suất', slug: 'bien-co-va-dinh-nghia-co-dien-cua-xac-suat', parentChapterId: 34, orderInParent: 1, level: 1 },
  { id: 36, subjectId: SUBJECT_IDS.MATH, code: '10C92', name: 'Thực hành tính xác suất theo định nghĩa cổ điển', slug: 'thuc-hanh-tinh-xac-suat-theo-dinh-nghia-co-dien', parentChapterId: 34, orderInParent: 2, level: 1 },

  // ==================== TOÁN HỌC - LỚP 11 ====================
  { id: 37, subjectId: SUBJECT_IDS.MATH, code: '11C1', name: 'HÀM SỐ LƯỢNG GIÁC VÀ PHƯƠNG TRÌNH LƯỢNG GIÁC', slug: 'ham-so-luong-giac-va-phuong-trinh-luong-giac', parentChapterId: null, orderInParent: 1, level: 0 },
  { id: 38, subjectId: SUBJECT_IDS.MATH, code: '11C11', name: 'Giá trị lượng giác của góc lượng giác', slug: 'gia-tri-luong-giac-cua-goc-luong-giac', parentChapterId: 37, orderInParent: 1, level: 1 },
  { id: 39, subjectId: SUBJECT_IDS.MATH, code: '11C12', name: 'Công thức lượng giác', slug: 'cong-thuc-luong-giac', parentChapterId: 37, orderInParent: 2, level: 1 },
  { id: 40, subjectId: SUBJECT_IDS.MATH, code: '11C13', name: 'Hàm số lượng giác', slug: 'ham-so-luong-giac', parentChapterId: 37, orderInParent: 3, level: 1 },
  { id: 41, subjectId: SUBJECT_IDS.MATH, code: '11C14', name: 'Phương trình lượng giác cơ bản', slug: 'phuong-trinh-luong-giac-co-ban', parentChapterId: 37, orderInParent: 4, level: 1 },

  { id: 42, subjectId: SUBJECT_IDS.MATH, code: '11C2', name: 'DÃY SỐ. CẤP SỐ CỘNG VÀ CẤP SỐ NHÂN', slug: 'day-so-cap-so-cong-va-cap-so-nhan', parentChapterId: null, orderInParent: 2, level: 0 },
  { id: 43, subjectId: SUBJECT_IDS.MATH, code: '11C21', name: 'Dãy số', slug: 'day-so', parentChapterId: 42, orderInParent: 1, level: 1 },
  { id: 44, subjectId: SUBJECT_IDS.MATH, code: '11C22', name: 'Cấp số cộng', slug: 'cap-so-cong', parentChapterId: 42, orderInParent: 2, level: 1 },
  { id: 45, subjectId: SUBJECT_IDS.MATH, code: '11C23', name: 'Cấp số nhân', slug: 'cap-so-nhan', parentChapterId: 42, orderInParent: 3, level: 1 },

  { id: 46, subjectId: SUBJECT_IDS.MATH, code: '11C3', name: 'CÁC SỐ ĐẶC TRƯNG ĐO XU THẾ TRUNG TÂM CỦA MẪU SỐ LIỆU GHÉP NHÓM', slug: 'cac-so-dac-trung-do-xu-the-trung-tam-cua-mau-so-lieu-ghep-nhom', parentChapterId: null, orderInParent: 3, level: 0 },
  { id: 47, subjectId: SUBJECT_IDS.MATH, code: '11C31', name: 'Mẫu số liệu ghép nhóm', slug: 'mau-so-lieu-ghep-nhom', parentChapterId: 46, orderInParent: 1, level: 1 },
  { id: 48, subjectId: SUBJECT_IDS.MATH, code: '11C32', name: 'Các số đặc trưng đo xu thế trung tâm', slug: 'cac-so-dac-trung-do-xu-the-trung-tam-2', parentChapterId: 46, orderInParent: 2, level: 1 },

  { id: 49, subjectId: SUBJECT_IDS.MATH, code: '11C4', name: 'QUAN HỆ SONG SONG TRONG KHÔNG GIAN', slug: 'quan-he-song-song-trong-khong-gian', parentChapterId: null, orderInParent: 4, level: 0 },
  { id: 50, subjectId: SUBJECT_IDS.MATH, code: '11C41', name: 'Đường thẳng và mặt phẳng trong không gian', slug: 'duong-thang-va-mat-phang-trong-khong-gian', parentChapterId: 49, orderInParent: 1, level: 1 },
  { id: 51, subjectId: SUBJECT_IDS.MATH, code: '11C42', name: 'Hai đường thẳng song song', slug: 'hai-duong-thang-song-song', parentChapterId: 49, orderInParent: 2, level: 1 },
  { id: 52, subjectId: SUBJECT_IDS.MATH, code: '11C43', name: 'Đường thẳng và mặt phẳng song song', slug: 'duong-thang-va-mat-phang-song-song', parentChapterId: 49, orderInParent: 3, level: 1 },
  { id: 53, subjectId: SUBJECT_IDS.MATH, code: '11C44', name: 'Hai mặt phẳng song song', slug: 'hai-mat-phang-song-song', parentChapterId: 49, orderInParent: 4, level: 1 },
  { id: 54, subjectId: SUBJECT_IDS.MATH, code: '11C45', name: 'Phép chiếu song song', slug: 'phep-chieu-song-song', parentChapterId: 49, orderInParent: 5, level: 1 },

  { id: 55, subjectId: SUBJECT_IDS.MATH, code: '11C5', name: 'GIỚI HẠN. HÀM SỐ LIÊN TỤC', slug: 'gioi-han-ham-so-lien-tuc', parentChapterId: null, orderInParent: 5, level: 0 },
  { id: 56, subjectId: SUBJECT_IDS.MATH, code: '11C51', name: 'Giới hạn của dãy số', slug: 'gioi-han-cua-day-so', parentChapterId: 55, orderInParent: 1, level: 1 },
  { id: 57, subjectId: SUBJECT_IDS.MATH, code: '11C52', name: 'Giới hạn của hàm số', slug: 'gioi-han-cua-ham-so', parentChapterId: 55, orderInParent: 2, level: 1 },
  { id: 58, subjectId: SUBJECT_IDS.MATH, code: '11C53', name: 'Hàm số liên tục', slug: 'ham-so-lien-tuc', parentChapterId: 55, orderInParent: 3, level: 1 },

  { id: 59, subjectId: SUBJECT_IDS.MATH, code: '11C6', name: 'HÀM SỐ MŨ VÀ HÀM SỐ LÔGARIT', slug: 'ham-so-mu-va-ham-so-logarit', parentChapterId: null, orderInParent: 6, level: 0 },
  { id: 60, subjectId: SUBJECT_IDS.MATH, code: '11C61', name: 'Luỹ thừa với số mũ thực', slug: 'luy-thua-voi-so-mu-thuc', parentChapterId: 59, orderInParent: 1, level: 1 },
  { id: 61, subjectId: SUBJECT_IDS.MATH, code: '11C62', name: 'Lôgarit', slug: 'logarit', parentChapterId: 59, orderInParent: 2, level: 1 },
  { id: 62, subjectId: SUBJECT_IDS.MATH, code: '11C63', name: 'Hàm số mũ và hàm số lôgarit', slug: 'ham-so-mu-va-ham-so-logarit-2', parentChapterId: 59, orderInParent: 3, level: 1 },
  { id: 63, subjectId: SUBJECT_IDS.MATH, code: '11C64', name: 'Phương trình, bất phương trình mũ và lôgarit', slug: 'phuong-trinh-bat-phuong-trinh-mu-va-logarit', parentChapterId: 59, orderInParent: 4, level: 1 },

  { id: 64, subjectId: SUBJECT_IDS.MATH, code: '11C7', name: 'QUAN HỆ VUÔNG GÓC TRONG KHÔNG GIAN', slug: 'quan-he-vuong-goc-trong-khong-gian', parentChapterId: null, orderInParent: 7, level: 0 },
  { id: 65, subjectId: SUBJECT_IDS.MATH, code: '11C71', name: 'Hai đường thẳng vuông góc', slug: 'hai-duong-thang-vuong-goc', parentChapterId: 64, orderInParent: 1, level: 1 },
  { id: 66, subjectId: SUBJECT_IDS.MATH, code: '11C72', name: 'Đường thẳng vuông góc với mặt phẳng', slug: 'duong-thang-vuong-goc-voi-mat-phang', parentChapterId: 64, orderInParent: 2, level: 1 },
  { id: 67, subjectId: SUBJECT_IDS.MATH, code: '11C73', name: 'Phép chiếu vuông góc. Góc giữa đường thẳng và mặt phẳng', slug: 'phep-chieu-vuong-goc-goc-giua-duong-thang-va-mat-phang', parentChapterId: 64, orderInParent: 3, level: 1 },
  { id: 68, subjectId: SUBJECT_IDS.MATH, code: '11C74', name: 'Hai mặt phẳng vuông góc', slug: 'hai-mat-phang-vuong-goc', parentChapterId: 64, orderInParent: 4, level: 1 },
  { id: 69, subjectId: SUBJECT_IDS.MATH, code: '11C75', name: 'Khoảng cách', slug: 'khoang-cach', parentChapterId: 64, orderInParent: 5, level: 1 },
  { id: 70, subjectId: SUBJECT_IDS.MATH, code: '11C76', name: 'Thể tích', slug: 'the-tich', parentChapterId: 64, orderInParent: 6, level: 1 },

  { id: 71, subjectId: SUBJECT_IDS.MATH, code: '11C8', name: 'CÁC QUY TẮC TÍNH XÁC SUẤT', slug: 'cac-quy-tac-tinh-xac-suat', parentChapterId: null, orderInParent: 8, level: 0 },
  { id: 72, subjectId: SUBJECT_IDS.MATH, code: '11C81', name: 'Biến cố hợp, biến cố giao, biến cố độc lập', slug: 'bien-co-hop-bien-co-giao-bien-co-doc-lap', parentChapterId: 71, orderInParent: 1, level: 1 },
  { id: 73, subjectId: SUBJECT_IDS.MATH, code: '11C82', name: 'Công thức cộng xác suất', slug: 'cong-thuc-cong-xac-suat', parentChapterId: 71, orderInParent: 2, level: 1 },
  { id: 74, subjectId: SUBJECT_IDS.MATH, code: '11C83', name: 'Công thức nhân xác suất cho hai biến cố độc lập', slug: 'cong-thuc-nhan-xac-suat-cho-hai-bien-co-doc-lap', parentChapterId: 71, orderInParent: 3, level: 1 },

  { id: 75, subjectId: SUBJECT_IDS.MATH, code: '11C9', name: 'ĐẠO HÀM', slug: 'dao-ham', parentChapterId: null, orderInParent: 9, level: 0 },
  { id: 76, subjectId: SUBJECT_IDS.MATH, code: '11C91', name: 'Định nghĩa và ý nghĩa của đạo hàm', slug: 'dinh-nghia-va-y-nghia-cua-dao-ham', parentChapterId: 75, orderInParent: 1, level: 1 },
  { id: 77, subjectId: SUBJECT_IDS.MATH, code: '11C92', name: 'Các quy tắc tính đạo hàm', slug: 'cac-quy-tac-tinh-dao-ham', parentChapterId: 75, orderInParent: 2, level: 1 },
  { id: 78, subjectId: SUBJECT_IDS.MATH, code: '11C93', name: 'Đạo hàm cấp hai', slug: 'dao-ham-cap-hai', parentChapterId: 75, orderInParent: 3, level: 1 },

  // ==================== TOÁN HỌC - LỚP 12 ====================
  { id: 79, subjectId: SUBJECT_IDS.MATH, code: '12C1', name: 'ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ HÀM SỐ', slug: 'ung-dung-dao-ham-de-khao-sat-va-ve-do-thi-ham-so', parentChapterId: null, orderInParent: 1, level: 0 },
  { id: 80, subjectId: SUBJECT_IDS.MATH, code: '12C11', name: 'Tính đơn điệu và cực trị của hàm số', slug: 'tinh-don-dieu-va-cuc-tri-cua-ham-so', parentChapterId: 79, orderInParent: 1, level: 1 },
  { id: 81, subjectId: SUBJECT_IDS.MATH, code: '12C12', name: 'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số', slug: 'gia-tri-lon-nhat-va-gia-tri-nho-nhat-cua-ham-so', parentChapterId: 79, orderInParent: 2, level: 1 },
  { id: 82, subjectId: SUBJECT_IDS.MATH, code: '12C13', name: 'Đường tiệm cận của đồ thị hàm số', slug: 'duong-tiem-can-cua-do-thi-ham-so', parentChapterId: 79, orderInParent: 3, level: 1 },
  { id: 83, subjectId: SUBJECT_IDS.MATH, code: '12C14', name: 'Khảo sát sự biến thiên và vẽ đồ thị của hàm số', slug: 'khao-sat-su-bien-thien-va-ve-do-thi-cua-ham-so', parentChapterId: 79, orderInParent: 4, level: 1 },
  { id: 84, subjectId: SUBJECT_IDS.MATH, code: '12C15', name: 'Ứng dụng đạo hàm để giải quyết một số vấn đề liên quan đến thực tiễn', slug: 'ung-dung-dao-ham-de-giai-quyet-mot-so-van-de-lien-quan-den-thuc-tien', parentChapterId: 79, orderInParent: 5, level: 1 },

  { id: 85, subjectId: SUBJECT_IDS.MATH, code: '12C2', name: 'VECTƠ VÀ HỆ TRỤC TOẠ ĐỘ TRONG KHÔNG GIAN', slug: 'vecto-va-he-truc-toa-do-trong-khong-gian', parentChapterId: null, orderInParent: 2, level: 0 },
  { id: 86, subjectId: SUBJECT_IDS.MATH, code: '12C21', name: 'Vectơ trong không gian', slug: 'vecto-trong-khong-gian', parentChapterId: 85, orderInParent: 1, level: 1 },
  { id: 87, subjectId: SUBJECT_IDS.MATH, code: '12C22', name: 'Hệ trục toạ độ trong không gian', slug: 'he-truc-toa-do-trong-khong-gian', parentChapterId: 85, orderInParent: 2, level: 1 },
  { id: 88, subjectId: SUBJECT_IDS.MATH, code: '12C23', name: 'Biểu thức toạ độ của các phép toán vectơ', slug: 'bieu-thuc-toa-do-cua-cac-phep-toan-vecto', parentChapterId: 85, orderInParent: 3, level: 1 },

  { id: 89, subjectId: SUBJECT_IDS.MATH, code: '12C3', name: 'CÁC SỐ ĐẶC TRƯNG ĐO MỨC ĐỘ PHÂN TÁN CỦA MẪU SỐ LIỆU GHÉP NHÓM', slug: 'cac-so-dac-trung-do-muc-do-phan-tan-cua-mau-so-lieu-ghep-nhom', parentChapterId: null, orderInParent: 3, level: 0 },
  { id: 90, subjectId: SUBJECT_IDS.MATH, code: '12C31', name: 'Khoảng biến thiên và khoảng tứ phân vị', slug: 'khoang-bien-thien-va-khoang-tu-phan-vi', parentChapterId: 89, orderInParent: 1, level: 1 },
  { id: 91, subjectId: SUBJECT_IDS.MATH, code: '12C32', name: 'Phương sai và độ lệch chuẩn', slug: 'phuong-sai-va-do-lech-chuan', parentChapterId: 89, orderInParent: 2, level: 1 },

  { id: 92, subjectId: SUBJECT_IDS.MATH, code: '12C4', name: 'NGUYÊN HÀM VÀ TÍCH PHÂN', slug: 'nguyen-ham-va-tich-phan', parentChapterId: null, orderInParent: 4, level: 0 },
  { id: 93, subjectId: SUBJECT_IDS.MATH, code: '12C41', name: 'Nguyên hàm', slug: 'nguyen-ham', parentChapterId: 92, orderInParent: 1, level: 1 },
  { id: 94, subjectId: SUBJECT_IDS.MATH, code: '12C42', name: 'Tích phân', slug: 'tich-phan', parentChapterId: 92, orderInParent: 2, level: 1 },
  { id: 95, subjectId: SUBJECT_IDS.MATH, code: '12C43', name: 'Ứng dụng hình học của tích phân', slug: 'ung-dung-hinh-hoc-cua-tich-phan', parentChapterId: 92, orderInParent: 3, level: 1 },

  { id: 96, subjectId: SUBJECT_IDS.MATH, code: '12C5', name: 'PHƯƠNG PHÁP TOẠ ĐỘ TRONG KHÔNG GIAN', slug: 'phuong-phap-toa-do-trong-khong-gian', parentChapterId: null, orderInParent: 5, level: 0 },
  { id: 97, subjectId: SUBJECT_IDS.MATH, code: '12C51', name: 'Phương trình mặt phẳng', slug: 'phuong-trinh-mat-phang', parentChapterId: 96, orderInParent: 1, level: 1 },
  { id: 98, subjectId: SUBJECT_IDS.MATH, code: '12C52', name: 'Phương trình đường thẳng trong không gian', slug: 'phuong-trinh-duong-thang-trong-khong-gian', parentChapterId: 96, orderInParent: 2, level: 1 },
  { id: 99, subjectId: SUBJECT_IDS.MATH, code: '12C53', name: 'Công thức tính góc trong không gian', slug: 'cong-thuc-tinh-goc-trong-khong-gian', parentChapterId: 96, orderInParent: 3, level: 1 },
  { id: 100, subjectId: SUBJECT_IDS.MATH, code: '12C54', name: 'Phương trình mặt cầu', slug: 'phuong-trinh-mat-cau', parentChapterId: 96, orderInParent: 4, level: 1 },

  { id: 101, subjectId: SUBJECT_IDS.MATH, code: '12C6', name: 'XÁC SUẤT CÓ ĐIỀU KIỆN', slug: 'xac-suat-co-dieu-kien', parentChapterId: null, orderInParent: 6, level: 0 },
  { id: 102, subjectId: SUBJECT_IDS.MATH, code: '12C61', name: 'Xác suất có điều kiện', slug: 'xac-suat-co-dieu-kien-2', parentChapterId: 101, orderInParent: 1, level: 1 },
  { id: 103, subjectId: SUBJECT_IDS.MATH, code: '12C62', name: 'Công thức xác suất toàn phần và công thức Bayes', slug: 'cong-thuc-xac-suat-toan-phen-va-cong-thuc-bayes', parentChapterId: 101, orderInParent: 2, level: 1 },
]

/**
 * Helper để lấy chapters theo subject
 */
export function getChaptersBySubject(subjectId: number) {
  return CHAPTERS.filter((chapter) => chapter.subjectId === subjectId)
}

/**
 * Helper để lấy root chapters (không có parent)
 */
export function getRootChapters() {
  return CHAPTERS.filter((chapter) => chapter.parentChapterId === null)
}

/**
 * Helper để lấy child chapters của một chapter
 */
export function getChildChapters(parentChapterId: number) {
  return CHAPTERS.filter((chapter) => chapter.parentChapterId === parentChapterId)
}
