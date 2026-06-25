/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  transpilePackages: ['three', '@react-three/postprocessing', 'postprocessing'],
};

export default nextConfig;