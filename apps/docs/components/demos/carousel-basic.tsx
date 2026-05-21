'use client';

import { Carousel } from '@nori-ui/core';

const SLIDES = [
    { color: '#6366f1', label: 'Slide 1' },
    { color: '#22c55e', label: 'Slide 2' },
    { color: '#f59e0b', label: 'Slide 3' },
    { color: '#ef4444', label: 'Slide 4' },
];

export default function CarouselBasic() {
    return (
        <div style={{ width: 400, height: 200, margin: '0 auto' }}>
            <Carousel>
                <Carousel.Content>
                    {SLIDES.map((slide) => (
                        <Carousel.Item key={slide.label}>
                            <div
                                style={{
                                    height: 200,
                                    backgroundColor: slide.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                }}
                            >
                                {slide.label}
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel.Content>
                <Carousel.Previous />
                <Carousel.Next />
                <Carousel.Dots />
            </Carousel>
        </div>
    );
}
