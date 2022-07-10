package louis.echarts.util;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;

/**
* @Description ECharts 工具类
* @Author Louis
* @Date 2022/07/10 16:36
*/
@Slf4j
public final class EChartsUtil {

    private static final String SUCCESS_CODE = "1";

    /**
    * @Description 生成ECharts图片的Base64编码
    * @Param [option]
    * @Return java.lang.String
    * @Author Louis
    * @Date 2022/07/10 16:40
    */
    public static String generateEChartsBase64(String phantomjsUrl, String option) {
        // 手动拼接option示例
        // String option = "{title:{text:'ECharts 示例'},tooltip:{},legend:{data:['销量']},xAxis:{data:['衬衫','羊毛衫','雪纺衫','裤子','高跟鞋','袜子']},yAxis:{},series:[{name:'销量',type:'bar',data:[5,20,36,10,10,20]}]}";
        if (!StringUtils.hasText(option)) {
            return null;
        }
        // 替换掉换行符，将双引号替换为单引号
        option = option.replaceAll("\\r\\n", "").replaceAll("\"", "'");
        // 将option字符串作为参数发送给echartsConvert服务器
        String result = RESTUtil.sendPostRequest(phantomjsUrl, "opt=" + option);
        // 解析echartsConvert响应
        JSONObject response = JSON.parseObject(result);
        // 如果echartsConvert正常返回
        if (SUCCESS_CODE.equals(response.getString("code"))) {
            return response.getString("data");
        } else {
            // 未正常返回
            log.error("ECharts Convert 服务器异常：{}", response);
        }
        return null;
    }

}
