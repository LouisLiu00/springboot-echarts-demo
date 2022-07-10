package louis.echarts.util;

import java.util.UUID;

/**
 * @ClassName CommonUtil
 * @Description 公共工具类
 * @Author Louis
 * @Date 2022/07/10 17:23:50
 */
public final class CommonUtil {

    /**
     * @Description 生成一个UUID
     * @Title getUUID
     * @Param []
     * @Return java.lang.String
     * @Author Louis
     * @Date 2021/11/26 11:47
     */
    public static String randomUUID(){
        return UUID.randomUUID().toString().replaceAll("-","");
    }

}
