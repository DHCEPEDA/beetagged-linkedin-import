//
//  Tag.h
//  
//
//  Created by Chris O'Neil on 1/5/14.
//
//

#import <Foundation/Foundation.h>
#import <Parse/Parse.h>
#import "TagOption.h"

@interface Tag : NSObject <NSCoding>


@property (nonatomic, strong) NSString *objectId;
@property (nonatomic, strong) NSString *attributeName;
@property (nonatomic, strong) NSString *taggedBy;
@property (nonatomic, strong) NSString *tagUserId;
@property (nonatomic, strong) NSString *tagOptionId;
@property (nonatomic, strong) NSDate *updatedAt;
@property (nonatomic, strong) NSDate *createdAt;
@property (nonatomic,strong) NSNumber *rank;

+ (Tag *)tagFromParse:(PFObject *)pfObject;
+ (Tag *)tagFromTagOption:(TagOption *)tagOption taggedUser:(NSString *)taggedUser byUser:(NSString *)byUser;
+ (Tag *)tagFromTagName:(NSString *)tagName taggedUser:(NSString *)taggedUser byUser:(NSString *)byUser withRank:(int)rank;
- (PFObject *)pfObject;

@end
