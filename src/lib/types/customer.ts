/**
 * Customer management types
 */

export interface Customer {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Quote {
	id: string;
	customerId?: string;
	customerName: string;
	quoteNumber: string;
	system: string;
	area: number;
	price: number;
	width: number;
	height: number;
	color: string;
	glassType: string;
	status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'completed';
	sentAt?: string;
	validUntil: string; // 30 days from creation
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface QuoteTemplate {
	id: string;
	name: string;
	system: string;
	color: string;
	glassType: string;
	notes?: string;
	createdAt: string;
}
