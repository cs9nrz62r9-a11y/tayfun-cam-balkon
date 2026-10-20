import html2pdf from 'html2pdf.js';
import { calculateInstallments, type InstallmentOption } from './installments';

export interface QuoteData {
	system: string;
	area: number;
	price: number;
	width: number;
	height: number;
	color: string;
	glassType: string;
	materials?: Record<string, unknown>;
	warnings?: string[];
	createdAt?: string;
	selectedInstallment?: InstallmentOption;
}

export async function generateQuotePDF(data: QuoteData) {
	const element = document.createElement('div');
	element.style.padding = '20px';
	element.style.fontFamily = 'Arial, sans-serif';
	element.style.maxWidth = '800px';
	element.style.margin = '0 auto';

	const date = data.createdAt ? new Date(data.createdAt).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');
	const time = data.createdAt ? new Date(data.createdAt).toLocaleTimeString('tr-TR') : new Date().toLocaleTimeString('tr-TR');
	const installments = calculateInstallments(data.price);

	element.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px;">
      <h1 style="color: #10b981; margin: 0;">Tayfun Yapı</h1>
      <p style="color: #666; margin: 5px 0;">Cam Balkon Sistemleri</p>
      <p style="color: #999; font-size: 12px; margin: 0;">Edremit, Balıkesir • Tel: +90-266-XXX-XXXX</p>
    </div>

    <h2 style="color: #1f2937; margin-top: 30px; margin-bottom: 15px;">FİYAT TEKLİFİ</h2>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <p style="margin: 8px 0;"><strong>Tarih:</strong> ${date} ${time}</p>
      <p style="margin: 8px 0;"><strong>Proje No:</strong> ${Date.now()}</p>
    </div>

    <h3 style="color: #374151; margin-bottom: 15px;">Ürün Bilgileri</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="background: #e5e7eb;">
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Sistem</td>
        <td style="padding: 10px; border: 1px solid #d1d5db;">${data.system}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Renk</td>
        <td style="padding: 10px; border: 1px solid #d1d5db;">${data.color}</td>
      </tr>
      <tr style="background: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Cam Türü</td>
        <td style="padding: 10px; border: 1px solid #d1d5db;">${data.glassType}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Ölçüler</td>
        <td style="padding: 10px; border: 1px solid #d1d5db;">${data.width} mm × ${data.height} mm</td>
      </tr>
      <tr style="background: #f9fafb;">
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold;">Alan</td>
        <td style="padding: 10px; border: 1px solid #d1d5db;">${data.area.toFixed(2)} m²</td>
      </tr>
    </table>

    <h3 style="color: #374151; margin-bottom: 15px;">Fiyat</h3>
    <div style="background: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px; border: 2px solid #10b981;">
      <p style="margin: 0; font-size: 12px; color: #666;">Toplam Fiyat</p>
      <h2 style="margin: 10px 0; color: #10b981; font-size: 36px;">₺${data.price.toLocaleString('tr-TR')}</h2>
      <p style="margin: 0; font-size: 12px; color: #999;">(KDV dahil)</p>
    </div>

    <h3 style="color: #374151; margin-bottom: 15px;">Vadeli Ödeme Seçenekleri (Kredi Kartı)</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <tr style="background: #10b981;">
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: white; text-align: center;">Ödeme Şekli</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: white; text-align: center;">Aylık Ödeme</td>
        <td style="padding: 10px; border: 1px solid #d1d5db; font-weight: bold; color: white; text-align: center;">Toplam Tutar</td>
      </tr>
      ${installments.options.map((option, idx) => `
      <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
        <td style="padding: 10px; border: 1px solid #d1d5db;">
          ${option.months === 1 ? 'Tek Ödeme' : option.months + ' Taksit'}
          ${option.interestRate > 0 ? `<br><span style="font-size: 11px; color: #666;">(%${option.interestRate} faiz)</span>` : ''}
        </td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right; font-weight: 500;">
          ₺${option.monthlyPayment.toLocaleString('tr-TR')}
        </td>
        <td style="padding: 10px; border: 1px solid #d1d5db; text-align: right;">
          ₺${option.totalAmount.toLocaleString('tr-TR')}
        </td>
      </tr>
      `).join('')}
    </table>

    ${data.warnings && data.warnings.length > 0 ? `
      <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Uyarılar</h4>
        <ul style="margin: 0; padding-left: 20px; color: #78350f;">
          ${data.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #999; text-align: center;">
      <p style="margin: 5px 0;">Bu teklif 30 gün geçerlidir.</p>
      <p style="margin: 5px 0;">Tayfun Yapı Cam Balkon Sistemleri</p>
      <p style="margin: 5px 0;">Edremit, Balıkesir • Türkiye</p>
    </div>
  `;

	const options = {
		margin: [10, 10, 10, 10],
		filename: `teklifler-${data.system}-${Date.now()}.pdf`,
		image: { type: 'jpeg', quality: 0.98 },
		html2canvas: { scale: 2 },
		jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
	};

	await html2pdf().set(options).from(element).save();
}
