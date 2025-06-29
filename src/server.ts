import config from './config/config';
import httpServer from './app';

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
