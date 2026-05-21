'use client';

import { InputOTP } from '@nori-ui/core';
import { useState } from 'react';

export default function InputOTPBasic() {
    const [code, setCode] = useState('');
    const [submitted, setSubmitted] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <InputOTP value={code} onChange={setCode} onComplete={(value) => setSubmitted(value)} length={6} />
            {submitted ? (
                <p style={{ color: '#22c55e', fontWeight: 500 }}>Code submitted: {submitted}</p>
            ) : (
                <p style={{ color: '#6b7280', fontSize: 14 }}>Enter 6 digits — auto-submits when complete.</p>
            )}
        </div>
    );
}
