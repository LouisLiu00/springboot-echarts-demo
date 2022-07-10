package louis.echarts.service;

import com.alibaba.fastjson.JSON;
import lombok.extern.slf4j.Slf4j;
import louis.echarts.util.Base64Util;
import louis.echarts.util.EChartsUtil;
import louis.echarts.util.FreemarkerUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

/**
 * @Description ECharts 图表服务层
 * @Author Louis
 * @Date 2022/07/10 17:14
 */
@Slf4j
@Service
public class EChartsService {

    // PhontomJS 服务网址
    @Value("${phantomjs.url}")
    private String phantomjsUrl;

    /**
    * @Description 生成图表
    * @Return java.io.File
    * @Author Louis
    * @Date 2022/07/10 17:30:19
    */
    public File generateEcharts(){
        // 数据参数，可以自己通过API查询json数据
        String title = "上海天气折线图";
        List<String> categories = Arrays.asList("2022-07-10", "2022-07-11", "2022-07-12", "2022-07-13", "2022-07-14", "2022-07-15", "2022-07-16", "2022-07-17", "2022-07-18", "2022-07-19", "2022-07-20", "2022-07-21", "2022-07-22");
        List<String> values = Arrays.asList("38", "33", "33", "31", "30", "32", "34", "37", "38", "37", "36", "38", "37");
        // 模板参数
        HashMap<String, Object> data = new HashMap<>();
        data.put("title", title);
        data.put("categories", JSON.toJSONString(categories));
        data.put("values", JSON.toJSONString(values));
        // 调用模板加载数据
        String option = FreemarkerUtil.generate("EChartsLineOption.ftl", data);
        // 生成图片的base64编码
        String base64 = EChartsUtil.generateEChartsBase64(phantomjsUrl, option);
        // 将base64转为文件
        return Base64Util.base64ToFile(base64);
    }

}
