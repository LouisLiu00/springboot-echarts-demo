package louis.echarts.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.annotation.PreDestroy;

/**
 * @ClassName ApplicationRunnerConfig
 * @Author Louis
 * @Date 2022/07/10 17:31:13
 */
@Slf4j
@Component
public class ApplicationRunnerConfig implements ApplicationRunner {

    @Autowired
    private ApplicationRunnerTest applicationRunnerTest;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        log.info("启动成功，万事顺遂！");
        applicationRunnerTest.run();
    }

    @PreDestroy
    public void preDestroy() {
        log.info("应用停止，欢迎下次使用！");
    }

}
