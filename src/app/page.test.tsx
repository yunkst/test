import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Home from '@/app/page'

describe('Home page', () => {
  it('renders the page intro text', () => {
    render(<Home />)
    expect(
      screen.getByText(/To get started, edit the/i),
    ).toBeInTheDocument()
  })

  it('renders the Templates link pointing at vercel.com', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /Templates/i })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('vercel.com/templates'),
    )
  })

  it('renders the Documentation link pointing at nextjs.org/docs', () => {
    render(<Home />)
    const link = screen.getByRole('link', { name: /Documentation/i })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('nextjs.org/docs'),
    )
  })
})
