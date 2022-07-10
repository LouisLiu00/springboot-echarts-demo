package louis.echarts.config;

import louis.echarts.service.EChartsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * @ClassName ApplicationRunnerTest
 * @Description 启动应用测试类
 * @Author Louis
 * @Date 2022/07/10 17:31:13
 */
@Component
public class ApplicationRunnerTest {

    @Autowired private EChartsService eChartsService;

    public void run() throws Exception {

        eChartsService.generateEcharts();

    }

}
