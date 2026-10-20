/**
 * Credit card installment calculation utility
 * Supports 1, 3, and 6 installment options
 */

export interface InstallmentOption {
	months: number;
	monthlyPayment: number;
	totalAmount: number;
	interestRate: number; // Interest rate as percentage
	totalInterest: number;
}

export interface InstallmentPlan {
	totalPrice: number;
	options: InstallmentOption[];
}

/**
 * Calculate installment options for a given price
 * Turkish credit card standard rates applied
 * 1 month: 0% (full price)
 * 3 months: 1.99% interest
 * 6 months: 3.99% interest
 */
export function calculateInstallments(price: number): InstallmentPlan {
	const rates: Record<number, number> = {
		1: 0,
		3: 1.99,
		6: 3.99
	};

	const months = [1, 3, 6];

	const options = months.map((month) => {
		const interestRate = rates[month];
		const totalInterest = (price * interestRate) / 100;
		const totalAmount = price + totalInterest;
		const monthlyPayment = totalAmount / month;

		return {
			months: month,
			monthlyPayment: Math.round(monthlyPayment * 100) / 100,
			totalAmount: Math.round(totalAmount * 100) / 100,
			interestRate,
			totalInterest: Math.round(totalInterest * 100) / 100
		};
	});

	return {
		totalPrice: price,
		options
	};
}

/**
 * Format installment option as Turkish text
 */
export function formatInstallmentOption(option: InstallmentOption): string {
	if (option.months === 1) {
		return `Tek ödeme: ₺${option.monthlyPayment.toLocaleString('tr-TR')}`;
	}

	return `${option.months} taksit: ₺${option.monthlyPayment.toLocaleString('tr-TR')}/ay (Toplam: ₺${option.totalAmount.toLocaleString('tr-TR')})`;
}

/**
 * Format installment details for display
 */
export function formatInstallmentDetails(option: InstallmentOption): string {
	if (option.months === 1) {
		return 'Tek ödeme (Faiz yok)';
	}

	return `%${option.interestRate} faiz - Toplam faiz: ₺${option.totalInterest.toLocaleString('tr-TR')}`;
}
