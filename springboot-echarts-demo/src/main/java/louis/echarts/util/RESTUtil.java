package louis.echarts.util;

import cn.hutool.http.HttpUtil;

/**
 * @ClassName RESTUtil
 * @Description 发送REST请求工具类
 * @Author Louis
 * @Date 2022/7/10 16:14
 */
public final class RESTUtil {

    public static String sendPostRequest(String url, String params) {
        return HttpUtil.createPost(url).body(params).execute().body();
    }

}
