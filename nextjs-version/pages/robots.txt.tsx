import { GetServerSideProps } from 'next'

function RobotsTxt() {
  return null
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const robots = `User-agent: *
Allow: /

Disallow: /dashboard
Disallow: /messages
Disallow: /profile
Disallow: /api/

Sitemap: https://www.shyamsyangtan.com/sitemap.xml`

  res.setHeader('Content-Type', 'text/plain')
  res.write(robots)
  res.end()

  return { props: {} }
}

export default RobotsTxt
