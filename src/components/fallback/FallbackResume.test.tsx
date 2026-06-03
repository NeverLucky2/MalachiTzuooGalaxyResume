import {describe, it, expect} from 'vitest';
import {render, screen} from '@testing-library/react';
import {FallbackResume} from './FallbackResume';

describe('FallbackResume', () => {
  it('renders every section heading and the resume PDF link', () => {
    render(<FallbackResume />);
    for (const h of ['About','Experience','Projects','Skills','Resume','Contact'])
      expect(screen.getByRole('heading', {name: new RegExp(h, 'i')})).toBeInTheDocument();
    const pdf = screen.getByRole('link', {name: /download resume/i});
    expect(pdf).toHaveAttribute('href', '/assets/Tzuoo_Malachi_Resume_.pdf');
  });
});
