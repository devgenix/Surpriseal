/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@ant-design/icons",
        "@ant-design/icons-svg",
        "rc-util", 
        "rc-pagination", 
        "rc-picker", 
        "rc-notification", 
        "rc-tooltip", 
        "rc-tree", 
        "rc-table"
    ],
};

export default nextConfig;
