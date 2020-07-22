exports.OPEN_SSL_URL = 'https://m.xiguacity.cn/electron-python/openssl-1.1.1g.tar.gz';

exports.RUNTIME_URL = 'https://zhishi.oss-cn-beijing.aliyuncs.com/electron-python/Python-3.7.8.tgz';

exports.SETUP_DIST = `
SSL=<%= sslPath %>
_ssl _ssl.c \\
        -DUSE_SSL -I$(SSL)/include -I$(SSL)/include/openssl \\
        -L$(SSL)/lib -lssl -lcrypto
`;

exports.PIP_MIRROR = 'https://pypi.tuna.tsinghua.edu.cn/simple';

exports.WINDOW_RUNTIME_URL = 'https://zhishi.oss-cn-beijing.aliyuncs.com/electron-python/python-3.7.8-embed-amd64.tgz';