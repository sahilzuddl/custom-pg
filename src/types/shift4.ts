export interface Shift4PaymentLinkCreateRequest {
    lineItems: {
        product?: {
            name: string;
            amount?: number;
            currency: string;
        };
        subscription?: {
            plan: string;
        };
    }[];
    collectBillingAddress?: boolean;
    collectShippingAddress?: boolean;
    restrictions?: Shift4PaymentLinkRestrictionsCreate;
    customer?: string;
    notifications?: Shift4Notification;
    customFieldsTitle?: string;
    customFields?: Shift4CustomField[];
    metadata?: Shift4Metadata;
}

export interface Shift4CustomField {
    key: string;
    label: string;
    optional: boolean;
}

export interface Shift4Notification {
    share?: {
        sms?: boolean;
    };
}

export interface Shift4PaymentLinkRestrictionsCreate {
    charges?: {
        limit?: number;
    };
    dates?: {
        expiresAt?: number;
        activatesAt?: number;
    };
}

export interface Shift4Metadata { 
    [key: string]: string;
}