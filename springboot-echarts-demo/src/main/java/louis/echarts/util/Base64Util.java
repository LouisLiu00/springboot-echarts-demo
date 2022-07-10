package louis.echarts.util;

import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.Base64;

/**
* @Description Base64 工具类
* @Author Louis
* @Date 2022/07/10 17:24
*/
@Slf4j
public final class Base64Util {


    /**
    * @Description 将Base64字符串转为文件对象
    * @Param [base64]
    * @Return java.io.File
    * @Author Louis
    * @Date 2022/07/10 17:25
    */
    public static File base64ToFile(String base64) {
        try {
            // Base64解码
            byte[] b = Base64.getDecoder().decode(base64);
            for(int i = 0; i < b.length; ++i ){
                if(b[i] < 0){
                    //调整异常数据
                    b[i] += 256;
                }
            }
            // 对文件重命名，设定为当前系统时间的毫秒数加UUID
            String newFileName = System.currentTimeMillis() + "-" + CommonUtil.randomUUID() + ".png";
            // 放在本地临时文件目录
            String localFilePath = String.format("%stemp%s%s%s%s%s%s", File.separator, File.separator, DateUtil.currentYear(), File.separator, DateUtil.currentMonth(), File.separator, DateUtil.currentDay());
            File filePath = new File(localFilePath);
            if (!filePath.exists()) {
                //　mkdirs(): 创建多层目录
                filePath.mkdirs();
            }
            // 文件全限定名
            String path = localFilePath + File.separator + newFileName;
            // 将数据通过流写入文件
            OutputStream out = new FileOutputStream(path);
            out.write(b);
            out.flush();
            out.close();
            return new File(path);
        } catch (Exception e) {
            log.error(e.toString());
        }
        return null;
    }

}
